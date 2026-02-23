import React, { useEffect, useState } from "react";
import {
    Typography,
    Container,
    Box,
    Grid,
    Paper
} from "@mui/material";
import { collection, doc, increment, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from "firebase/firestore";
import HomeArticleCard from "../components/HomeArticleCard";
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

const Home = () => {
    const [topArticles, setTopArticles] = useState([]);
    const [postReactions, setPostReactions] = useState({});

    useEffect(() => {
        if (!db) return undefined;

        const topArticlesQuery = query(
            collection(db, "articles"),
            orderBy("likes", "desc"),
            limit(3)
        );

        const unsubscribe = onSnapshot(topArticlesQuery, (snapshot) => {
            const items = snapshot.docs.map((docItem) => ({
                id: docItem.id,
                ...docItem.data()
            }));

            setTopArticles(items);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const currentUser = auth.currentUser;

        if (!db || !currentUser || topArticles.length === 0) {
            setPostReactions({});
            return undefined;
        }

        const unsubscribers = topArticles.map((article) => {
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
    }, [topArticles]);

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

    return (
        <>
            {/* Hero Section */}
            <Box
                sx={{
                    height: "400px",
                    backgroundImage:
                        "url('https://images.unsplash.com/photo-1554284126-aa88f22d8b74')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    position: "relative",
                    marginTop: "90px"
                }}
            >
                <Box
                    sx={{
                        backgroundColor: "rgba(255,255,255,0.7)",
                        padding: 4,
                        borderRadius: 3,
                        width: "90%",
                        maxWidth: "1100px",
                        backdropFilter: "blur(6px)"
                    }}
                >
                    <Typography variant="h2" fontWeight="bold">
                        NEW YOU.
                    </Typography>
                    <Typography mt={2}>
                        A collection of articles, knowledge, and a community
                        <br />
                        for health enthusiasts
                    </Typography>
                </Box>
            </Box>

            {/* Articles Section */}
            <Container
                sx={{
                    mt: 6,
                    width: "90%",
                    maxWidth: "1100px",
                }}
            >
                <Typography variant="h4" gutterBottom>
                    Articles
                </Typography>

                <Grid container spacing={3} justifyContent="space-between">
                    {topArticles.length > 0 ? topArticles.map((article) => (
                        <Grid
                            item
                            xs={12}
                            key={article.id}
                            sx={{
                                flexBasis: { md: "30%" },
                                maxWidth: { md: "30%" }
                            }}
                        >
                            <HomeArticleCard
                                title={article.title || "Untitled"}
                                description={article.description || article.content || "-"}
                                image={article.image}
                                date={formatDate(article.createdAt)}
                                author={article.author || "Unknown"}
                                likes={article.likes ?? 0}
                                dislikes={article.dislikes ?? 0}
                                liked={postReactions[article.id] === "likes"}
                                disliked={postReactions[article.id] === "dislikes"}
                                onLike={() => handlePostReaction(article.id, "likes")}
                                onDislike={() => handlePostReaction(article.id, "dislikes")}
                                linkTo={`/articles/${article.id}`}
                            />
                        </Grid>
                    )) : (
                        <Grid item xs={12}>
                            <Typography color="text.secondary">ยังไม่มีบทความ</Typography>
                        </Grid>
                    )}
                </Grid>
            </Container>

            {/* FAQ Section */}
            <Container sx={{ mt: 8, mb: 8 }}>
                <Typography variant="h4" gutterBottom>
                    Frequently Asked Questions
                </Typography>

                <Paper sx={{ p: 4, borderRadius: 4 }}>
                    <Typography variant="h6">Talk space</Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        Join the discussion with us
                    </Typography>

                    <Box sx={{ borderTop: "1px solid #ccc", pt: 2 }}>
                        <Typography variant="body2">
                            • Natthajak: ทุกคนชอบออกกำลังกายไหมครับ
                        </Typography>
                        <Typography variant="body2">
                            • Irada: ลดน้ำหนักแบบไหนดี
                        </Typography>
                    </Box>
                </Paper>
            </Container>

            {/* Footer */}
            <Box
                sx={{
                    bgcolor: "black",
                    color: "white",
                    textAlign: "center",
                    p: 2
                }}
            >
                <Typography variant="body2">
                    Copyright © 2026 NEW YOU
                </Typography>
            </Box>
        </>
    );
};

export default Home;