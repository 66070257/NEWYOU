import React, { useEffect, useState } from "react";
import {
    Typography,
    Container,
    Box,
    Grid,
    Paper
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { collection, doc, increment, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from "firebase/firestore";
import HomeArticleCard from "../components/HomeArticleCard";
import VoteButton from "../components/VoteButton";
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
    const navigate = useNavigate();
    const [topArticles, setTopArticles] = useState([]);
    const [topQuestions, setTopQuestions] = useState([]);
    const [postReactions, setPostReactions] = useState({});
    const [questionReactions, setQuestionReactions] = useState({});

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
        if (!db) return undefined;

        const topQuestionsQuery = query(
            collection(db, "questions"),
            orderBy("likes", "desc"),
            limit(3)
        );

        const unsubscribe = onSnapshot(topQuestionsQuery, (snapshot) => {
            const items = snapshot.docs.map((docItem) => ({
                id: docItem.id,
                ...docItem.data()
            }));

            setTopQuestions(items);
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

    useEffect(() => {
        const currentUser = auth.currentUser;

        if (!db || !currentUser || topQuestions.length === 0) {
            setQuestionReactions({});
            return undefined;
        }

        const unsubscribers = topQuestions.map((question) => {
            const reactionRef = doc(db, "questions", question.id, "reactions", currentUser.uid);

            return onSnapshot(reactionRef, (reactionSnap) => {
                setQuestionReactions((previous) => ({
                    ...previous,
                    [question.id]: reactionSnap.exists() ? reactionSnap.data()?.type : null
                }));
            });
        });

        return () => {
            unsubscribers.forEach((unsubscribe) => unsubscribe());
        };
    }, [topQuestions]);

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

    const handleQuestionReaction = async (questionId, field) => {
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
                            <Typography color="text.secondary">No articles yet</Typography>
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
                        {topQuestions.length > 0 ? topQuestions.map((question) => (
                            <Box
                                key={question.id}
                                onClick={() => navigate(`/qna/${question.id}`)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        navigate(`/qna/${question.id}`);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                                sx={{
                                    mb: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    px: 1,
                                    py: 0.75,
                                    borderRadius: 1,
                                    color: "inherit",
                                    textDecoration: "none",
                                    fontSize: "0.875rem",
                                    transition: "background-color 0.2s ease, transform 0.05s ease",
                                    cursor: "pointer",
                                    "&:hover": {
                                        backgroundColor: "action.hover"
                                    },
                                    "&:active": {
                                        backgroundColor: "action.selected",
                                        transform: "scale(0.99)",
                                        textDecoration: "none"
                                    }
                                }}
                            >
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography
                                            variant="body2"
                                            noWrap
                                            sx={{ color: "inherit", textDecoration: "none" }}
                                        >
                                            <strong>{question.author || "Unknown"}</strong>: {question.title || "Untitled"}
                                        </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                                    {formatDate(question.createdAt)}
                                </Typography>
                                <VoteButton
                                    type="likes"
                                    active={questionReactions[question.id] === "likes"}
                                    count={question.likes ?? 0}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        handleQuestionReaction(question.id, "likes");
                                    }}
                                    sx={{
                                        whiteSpace: "nowrap"
                                    }}
                                />
                                <VoteButton
                                    type="dislikes"
                                    active={questionReactions[question.id] === "dislikes"}
                                    count={question.dislikes ?? 0}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        handleQuestionReaction(question.id, "dislikes");
                                    }}
                                    sx={{ whiteSpace: "nowrap" }}
                                />
                            </Box>
                        )) : (
                            <Typography variant="body2" color="text.secondary">
                                No questions yet
                            </Typography>
                        )}
                    </Box>
                </Paper>
            </Container>

        </>
    );
};

export default Home;