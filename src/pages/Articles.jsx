import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import ArticleCard from "../components/ArticleCard";
import CircleIconButton from "../components/CircleIconButton";
import SearchBar from "../components/SearchBar";
import SortDropdown from "../components/SortDropdown";
import { auth, db } from "../database/firebase";
import { FIRESTORE_COLLECTIONS } from "../constants/collections";
import { LIST_PAGE_CONTAINER_SX, LIST_PAGE_HEADER_SX, LIST_PAGE_SEARCH_SORT_ROW_SX } from "../constants/layout";
import { APP_ROUTES, articleContentRoute } from "../constants/routes";
import { ALERT_MESSAGES } from "../constants/messages";
import { ARTICLES_UI_TEXT, SHARED_UI_TEXT } from "../constants/uiText";
import { POST_SORT_OPTIONS } from "../constants/sortOptions";
import { filterByDateRange, formatDate, getCreatedAtMillis } from "../utils/date";
import { mapSnapshotDocs } from "../utils/firestore";
import { applyReactionTransaction } from "../utils/reactions";

const Articles = () => {
    const [articles, setArticles] = useState([]);
    const [postReactions, setPostReactions] = useState({});
    const [sortBy, setSortBy] = useState("newest");
    const [searchTerm, setSearchTerm] = useState("");

    const sortedArticles = useMemo(() => {
        const items = [...articles];

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
    }, [articles, sortBy]);

    const visibleArticles = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        if (!keyword) return sortedArticles;

        return sortedArticles.filter((article) =>
            [article.title, article.description, article.content, article.author]
                .some((value) => String(value || "").toLowerCase().includes(keyword))
        );
    }, [searchTerm, sortedArticles]);

    const handlePostReaction = async (articleId, field) => {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            alert(ALERT_MESSAGES.AUTH_REQUIRED_FOR_VOTE);
            return;
        }

        try {
            const postRef = doc(db, FIRESTORE_COLLECTIONS.ARTICLES, articleId);
            const reactionRef = doc(db, FIRESTORE_COLLECTIONS.ARTICLES, articleId, FIRESTORE_COLLECTIONS.REACTIONS, currentUser.uid);

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

        const articlesQuery = query(collection(db, FIRESTORE_COLLECTIONS.ARTICLES), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(articlesQuery, (snapshot) => {
            setArticles(mapSnapshotDocs(snapshot));
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const currentUser = auth.currentUser;

        if (!db || !currentUser || articles.length === 0) {
            setPostReactions({});
            return undefined;
        }

        const unsubscribers = articles.map((article) => {
            const reactionRef = doc(db, FIRESTORE_COLLECTIONS.ARTICLES, article.id, FIRESTORE_COLLECTIONS.REACTIONS, currentUser.uid);

            return onSnapshot(reactionRef, (reactionSnap) => {
                setPostReactions((previous) => ({
                    ...previous,
                    [article.id]: reactionSnap.exists() ? reactionSnap.data()?.type : null
                }));
            });
        });

        return () => {
            unsubscribers.forEach((unsubscribe) => unsubscribe());
        };
    }, [articles]);

    return (
        <>
            <Box
                sx={LIST_PAGE_CONTAINER_SX}
            >
                <Box sx={LIST_PAGE_HEADER_SX}>
                    <Typography variant="h2" fontWeight="bold">
                        {ARTICLES_UI_TEXT.PAGE_TITLE}
                    </Typography>

                    <CircleIconButton
                        icon={<AddIcon />}
                        component={Link}
                        to={APP_ROUTES.NEW_POST}
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
                        placeholder={ARTICLES_UI_TEXT.SEARCH_PLACEHOLDER}
                    />
                    <SortDropdown
                        value={sortBy}
                        onChange={setSortBy}
                        options={POST_SORT_OPTIONS}
                    />
                </Box>
                {visibleArticles.length > 0 ? (
                    visibleArticles.map((article) => (
                        <ArticleCard
                            key={article.id}
                            title={article.title}
                            description={article.description || article.content}
                            date={formatDate(article.createdAt)}
                            author={article.author || SHARED_UI_TEXT.UNKNOWN_AUTHOR}
                            image={article.image}
                            likes={article.likes ?? 0}
                            dislikes={article.dislikes ?? 0}
                            liked={postReactions[article.id] === "likes"}
                            disliked={postReactions[article.id] === "dislikes"}
                            onLike={() => handlePostReaction(article.id, "likes")}
                            onDislike={() => handlePostReaction(article.id, "dislikes")}
                            linkTo={articleContentRoute(article.id)}
                        />
                    ))
                ) : (
                    <Typography color="text.secondary">
                        {searchTerm.trim() ? ARTICLES_UI_TEXT.EMPTY_MATCHING : ARTICLES_UI_TEXT.EMPTY_ALL}
                    </Typography>
                )}
            </Box>
        </>
    );
};

export default Articles;