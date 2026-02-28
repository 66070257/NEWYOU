import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import { collection, doc, increment, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from "firebase/firestore";
import ArticleCard from "../components/ArticleCard";
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
            alert("Please log in before voting.");
            return;
        }

        try {
            const postRef = doc(db, "articles", articleId);
            const reactionRef = doc(db, "articles", articleId, "reactions", currentUser.uid);

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

        const articlesQuery = query(collection(db, "articles"), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(articlesQuery, (snapshot) => {
            const items = snapshot.docs.map((docItem) => ({
                id: docItem.id,
                ...docItem.data()
            }));

            setArticles(items);
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
            const reactionRef = doc(db, "articles", article.id, "reactions", currentUser.uid);

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
                        Articles
                    </Typography>

                    <CircleIconButton
                        icon={<AddIcon />}
                        component={Link}
                        to="/new-post"
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
                        placeholder="Search articles..."
                    />
                    <SortDropdown
                        value={sortBy}
                        onChange={setSortBy}
                        options={SORT_OPTIONS}
                    />
                </Box>

                {/* Articles List */}
                {visibleArticles.length > 0 ? (
                    visibleArticles.map((article) => (
                        <ArticleCard
                            key={article.id}
                            title={article.title}
                            description={article.description || article.content}
                            date={formatDate(article.createdAt)}
                            author={article.author || "Unknown"}
                            image={article.image}
                            likes={article.likes ?? 0}
                            dislikes={article.dislikes ?? 0}
                            liked={postReactions[article.id] === "likes"}
                            disliked={postReactions[article.id] === "dislikes"}
                            onLike={() => handlePostReaction(article.id, "likes")}
                            onDislike={() => handlePostReaction(article.id, "dislikes")}
                            linkTo={`/articles/${article.id}`}
                        />
                    ))
                ) : (
                    <Typography color="text.secondary">
                        {searchTerm.trim() ? "No matching articles" : "No articles yet"}
                    </Typography>
                )}

            </Box>
        </>
    );
};

export default Articles;