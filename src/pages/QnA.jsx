import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import { collection, doc, increment, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from "firebase/firestore";
import QnACard from "../components/QnACard";
import CircleIconButton from "../components/CircleIconButton";
import SearchBar from "../components/SearchBar";
import SortDropdown from "../components/SortDropdown";
import { auth, db } from "../database/firebase";

const SORT_OPTIONS = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "popular-alltime", label: "Popular (All time)" },
    { value: "popular-month", label: "Popular (Month)" },
    { value: "popular-year", label: "Popular (Year)" },
    { value: "popular-day", label: "Popular (Day)" }
];

const getCreatedAtMillis = (value) => {
    if (!value) return 0;

    if (typeof value === "string") {
        const parsedValue = Date.parse(value);
        return Number.isNaN(parsedValue) ? 0 : parsedValue;
    }

    if (value?.toDate) {
        return value.toDate().getTime();
    }

    return 0;
};

const filterByDateRange = (items, range, nowTime) => {
    if (range === "alltime") return items;

    const millisecondsByRange = {
        day: 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        year: 365 * 24 * 60 * 60 * 1000
    };

    const rangeMilliseconds = millisecondsByRange[range];
    if (!rangeMilliseconds) return items;

    const thresholdTime = nowTime - rangeMilliseconds;

    return items.filter((item) => getCreatedAtMillis(item.createdAt) >= thresholdTime);
};

const formatDate = (value) => {
    if (!value) return "-";

    if (typeof value === "string") return value;

    if (value?.toDate) {
        return value.toDate().toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "2-digit"
        });
    }

    return "-";
};

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
            alert("Please log in before voting.");
            return;
        }

        try {
            const postRef = doc(db, "questions", questionId);
            const reactionRef = doc(db, "questions", questionId, "reactions", currentUser.uid);

            await runTransaction(db, async (transaction) => {
                const reactionSnap = await transaction.get(reactionRef);

                if (!reactionSnap.exists()) {
                    transaction.update(postRef, {
                        [field]: increment(1)
                    });

                    transaction.set(reactionRef, {
                        uid: currentUser.uid,
                        type: field,
                        createdAt: serverTimestamp()
                    });
                    return;
                }

                const previousType = reactionSnap.data()?.type;

                if (previousType === field) {
                    transaction.update(postRef, {
                        [field]: increment(-1)
                    });
                    transaction.delete(reactionRef);
                    return;
                }

                transaction.update(postRef, {
                    [previousType]: increment(-1),
                    [field]: increment(1)
                });

                transaction.update(reactionRef, {
                    type: field,
                    updatedAt: serverTimestamp()
                });
            });
        } catch (error) {
            alert("Failed to update post reaction.");
        }
    };

    useEffect(() => {
        if (!db) return undefined;

        const questionsQuery = query(collection(db, "questions"), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(questionsQuery, (snapshot) => {
            const items = snapshot.docs.map((docItem) => ({
                id: docItem.id,
                ...docItem.data()
            }));

            setQuestions(items);
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
            const reactionRef = doc(db, "questions", question.id, "reactions", currentUser.uid);

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
                sx={{
                    mt: 15,
                    width: "90%",
                    maxWidth: "1100px",
                    margin: "0 auto",
                    paddingTop: "100px"
                }}
            >

                {/* Header */}
                <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                    <Typography variant="h2" fontWeight="bold">
                        Question And Answer
                    </Typography>

                    <CircleIconButton
                        icon={<AddIcon sx={{ color: "black" }} />}
                        component={Link}
                        to="/new-post"
                        state={{ postType: "qna" }}
                        borderColor="black"
                        iconColor="black"
                        sx={{
                            ml: 2
                        }}
                    />
                </Box>

                {/* Sort */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search questions..."
                    />
                    <SortDropdown
                        value={sortBy}
                        onChange={setSortBy}
                        options={SORT_OPTIONS}
                    />
                </Box>

                {/* Q&A List */}
                {visibleQuestions.length > 0 ? (
                    visibleQuestions.map((question) => (
                        <QnACard
                            key={question.id}
                            title={question.title}
                            date={formatDate(question.createdAt)}
                            author={question.author || "Unknown"}
                            likes={question.likes ?? 0}
                            dislikes={question.dislikes ?? 0}
                            liked={postReactions[question.id] === "likes"}
                            disliked={postReactions[question.id] === "dislikes"}
                            onLike={() => handlePostReaction(question.id, "likes")}
                            onDislike={() => handlePostReaction(question.id, "dislikes")}
                            linkTo={`/qna/${question.id}`}
                        />
                    ))
                ) : (
                    <Typography color="text.secondary">
                        {searchTerm.trim() ? "No matching questions" : "No questions yet"}
                    </Typography>
                )}

            </Box>
        </>
    );
};

export default QnA;