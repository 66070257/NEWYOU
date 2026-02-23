import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import { collection, doc, increment, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from "firebase/firestore";
import ArticleCard from "../components/ArticleCard";
import { auth, db } from "../database/firebase";

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

    const handlePostReaction = async (articleId, field) => {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            alert("กรุณาเข้าสู่ระบบก่อนกดโหวต");
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
            alert("อัปเดตคะแนนโพสต์ไม่สำเร็จ");
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

                    <Button
                        component={Link}
                        to="/new-post"
                        sx={{
                            ml: 2,
                            minWidth: 0,
                            border: "2px solid black",
                            borderRadius: "50%",
                            width: 40,
                            height: 40
                        }}
                    >
                        <AddIcon />
                    </Button>
                </Box>

                {/* Sort */}
                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
                    <Button
                        variant="outlined"
                        sx={{
                            borderRadius: "20px",
                            textTransform: "none"
                        }}
                    >
                        Sort By
                    </Button>
                </Box>

                {/* Articles List */}
                {articles.length > 0 ? (
                    articles.map((article) => (
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
                    <Typography color="text.secondary">ยังไม่มีบทความ</Typography>
                )}

            </Box>
        </>
    );
};

export default Articles;