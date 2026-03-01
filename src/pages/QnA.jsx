import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import QnACard from "../components/QnACard";
import CircleIconButton from "../components/CircleIconButton";
import SearchBar from "../components/SearchBar";
import SortDropdown from "../components/SortDropdown";
import { auth, db } from "../database/firebase";
import { FIRESTORE_COLLECTIONS } from "../constants/collections";
import { LIST_PAGE_CONTAINER_SX, LIST_PAGE_HEADER_SX, LIST_PAGE_SEARCH_SORT_ROW_SX } from "../constants/layout";
import { APP_ROUTES, qnaContentRoute } from "../constants/routes";
import { ALERT_MESSAGES } from "../constants/messages";
import { QNA_UI_TEXT, SHARED_UI_TEXT } from "../constants/uiText";
import { POST_SORT_OPTIONS } from "../constants/sortOptions";
import { filterByDateRange, formatDate, getCreatedAtMillis } from "../utils/date";
import { mapSnapshotDocs } from "../utils/firestore";
import { applyReactionTransaction } from "../utils/reactions";

const QnA = () => {
    const [questions, setQuestions] = useState([]);
    const [postReactions, setPostReactions] = useState({});
    const [sortBy, setSortBy] = useState("newest");
    const [searchTerm, setSearchTerm] = useState("");

    const sortedQuestions = useMemo(() => {
        const items = [...questions];

        switch (sortBy) {
            case "oldest":
                return items.sort((firstItem, secondItem) =>
                    getCreatedAtMillis(firstItem.createdAt) - getCreatedAtMillis(secondItem.createdAt)
                );
            case "popular-alltime":
            case "popular-month":
            case "popular-year":
            case "popular-day": {
                const nowTime = Date.now();
                const range = sortBy.replace("popular-", "");

                return filterByDateRange(items, range, nowTime)
                    .sort((firstItem, secondItem) => (secondItem.likes ?? 0) - (firstItem.likes ?? 0));
            }
            case "newest":
            default:
                return items.sort((firstItem, secondItem) =>
                    getCreatedAtMillis(secondItem.createdAt) - getCreatedAtMillis(firstItem.createdAt)
                );
        }
    }, [questions, sortBy]);

    const visibleQuestions = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        if (!keyword) return sortedQuestions;

        return sortedQuestions.filter((question) =>
            [question.title, question.details, question.content, question.author]
                .some((value) => String(value || "").toLowerCase().includes(keyword))
        );
    }, [searchTerm, sortedQuestions]);

    const handlePostReaction = async (questionId, field) => {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            alert(ALERT_MESSAGES.AUTH_REQUIRED_FOR_VOTE);
            return;
        }

        try {
            const postRef = doc(db, FIRESTORE_COLLECTIONS.QUESTIONS, questionId);
            const reactionRef = doc(db, FIRESTORE_COLLECTIONS.QUESTIONS, questionId, FIRESTORE_COLLECTIONS.REACTIONS, currentUser.uid);

            await applyReactionTransaction({
                db,
                itemRef: postRef,
                reactionRef,
                field,
                uid: currentUser.uid
            });
        } catch (error) {
            alert(ALERT_MESSAGES.POST_REACTION_UPDATE_FAILED);
        }
    };

    useEffect(() => {
        if (!db) return undefined;

        const questionsQuery = query(collection(db, FIRESTORE_COLLECTIONS.QUESTIONS), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(questionsQuery, (snapshot) => {
            setQuestions(mapSnapshotDocs(snapshot));
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const currentUser = auth.currentUser;

        if (!db || !currentUser || questions.length === 0) {
            setPostReactions({});
            return undefined;
        }

        const unsubscribers = questions.map((question) => {
            const reactionRef = doc(db, FIRESTORE_COLLECTIONS.QUESTIONS, question.id, FIRESTORE_COLLECTIONS.REACTIONS, currentUser.uid);

            return onSnapshot(reactionRef, (reactionSnap) => {
                setPostReactions((previous) => ({
                    ...previous,
                    [question.id]: reactionSnap.exists() ? reactionSnap.data()?.type : null
                }));
            });
        });

        return () => {
            unsubscribers.forEach((unsubscribe) => unsubscribe());
        };
    }, [questions]);

    return (
        <>
            <Box
                sx={LIST_PAGE_CONTAINER_SX}
            >
                <Box sx={LIST_PAGE_HEADER_SX}>
                    <Typography variant="h2" fontWeight="bold">
                        {QNA_UI_TEXT.PAGE_TITLE}
                    </Typography>

                    <CircleIconButton
                        icon={<AddIcon sx={{ color: "black" }} />}
                        component={Link}
                        to={APP_ROUTES.NEW_POST}
                        state={{ postType: "qna" }}
                        borderColor="black"
                        iconColor="black"
                        sx={{
                            ml: 2
                        }}
                    />
                </Box>
                <Box sx={LIST_PAGE_SEARCH_SORT_ROW_SX}>
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder={QNA_UI_TEXT.SEARCH_PLACEHOLDER}
                    />
                    <SortDropdown
                        value={sortBy}
                        onChange={setSortBy}
                        options={POST_SORT_OPTIONS}
                    />
                </Box>
                {visibleQuestions.length > 0 ? (
                    visibleQuestions.map((question) => (
                        <QnACard
                            key={question.id}
                            title={question.title}
                            date={formatDate(question.createdAt)}
                            author={question.author || SHARED_UI_TEXT.UNKNOWN_AUTHOR}
                            likes={question.likes ?? 0}
                            dislikes={question.dislikes ?? 0}
                            liked={postReactions[question.id] === "likes"}
                            disliked={postReactions[question.id] === "dislikes"}
                            onLike={() => handlePostReaction(question.id, "likes")}
                            onDislike={() => handlePostReaction(question.id, "dislikes")}
                            linkTo={qnaContentRoute(question.id)}
                        />
                    ))
                ) : (
                    <Typography color="text.secondary">
                        {searchTerm.trim() ? QNA_UI_TEXT.EMPTY_MATCHING : QNA_UI_TEXT.EMPTY_ALL}
                    </Typography>
                )}
            </Box>
        </>
    );
};

export default QnA;