import React, { useEffect, useState } from "react";
import {
    Typography,
    Container,
    Box,
    Grid,
    Paper
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { collection, doc, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import HomeArticleCard from "../components/HomeArticleCard";
import VoteButton from "../components/VoteButton";
import { auth, db } from "../database/firebase";
import { FIRESTORE_COLLECTIONS } from "../constants/collections";
import { articleContentRoute, qnaContentRoute } from "../constants/routes";
import { ALERT_MESSAGES } from "../constants/messages";
import { HOME_UI_TEXT, SHARED_UI_TEXT } from "../constants/uiText";
import { formatDate } from "../utils/date";
import { mapSnapshotDocs } from "../utils/firestore";
import { applyReactionTransaction } from "../utils/reactions";

const Home = () => {
    const navigate = useNavigate();
    const [topArticles, setTopArticles] = useState([]);
    const [topQuestions, setTopQuestions] = useState([]);
    const [postReactions, setPostReactions] = useState({});
    const [questionReactions, setQuestionReactions] = useState({});

    useEffect(() => {
        if (!db) return undefined;

        const topArticlesQuery = query(
            collection(db, FIRESTORE_COLLECTIONS.ARTICLES),
            orderBy("likes", "desc"),
            limit(3)
        );

        const unsubscribe = onSnapshot(topArticlesQuery, (snapshot) => {
            setTopArticles(mapSnapshotDocs(snapshot));
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!db) return undefined;

        const topQuestionsQuery = query(
            collection(db, FIRESTORE_COLLECTIONS.QUESTIONS),
            orderBy("likes", "desc"),
            limit(3)
        );

        const unsubscribe = onSnapshot(topQuestionsQuery, (snapshot) => {
            setTopQuestions(mapSnapshotDocs(snapshot));
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
    }, [topArticles]);

    useEffect(() => {
        const currentUser = auth.currentUser;

        if (!db || !currentUser || topQuestions.length === 0) {
            setQuestionReactions({});
            return undefined;
        }

        const unsubscribers = topQuestions.map((question) => {
            const reactionRef = doc(db, FIRESTORE_COLLECTIONS.QUESTIONS, question.id, FIRESTORE_COLLECTIONS.REACTIONS, currentUser.uid);

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

    const handleQuestionReaction = async (questionId, field) => {
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

    return (
        <>
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
                        {HOME_UI_TEXT.HERO_TITLE}
                    </Typography>
                    <Typography mt={2}>
                        {HOME_UI_TEXT.HERO_SUBTITLE_LINE1}
                        <br />
                        {HOME_UI_TEXT.HERO_SUBTITLE_LINE2}
                    </Typography>
                </Box>
            </Box>

            <Container
                sx={{
                    mt: 6,
                    width: "90%",
                    maxWidth: "1100px",
                }}
            >
                <Typography variant="h4" gutterBottom>
                    {HOME_UI_TEXT.ARTICLES_SECTION_TITLE}
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
                                title={article.title || SHARED_UI_TEXT.UNTITLED}
                                description={article.description || article.content || "-"}
                                image={article.image}
                                date={formatDate(article.createdAt)}
                                author={article.author || SHARED_UI_TEXT.UNKNOWN_AUTHOR}
                                likes={article.likes ?? 0}
                                dislikes={article.dislikes ?? 0}
                                liked={postReactions[article.id] === "likes"}
                                disliked={postReactions[article.id] === "dislikes"}
                                onLike={() => handlePostReaction(article.id, "likes")}
                                onDislike={() => handlePostReaction(article.id, "dislikes")}
                                linkTo={articleContentRoute(article.id)}
                            />
                        </Grid>
                    )) : (
                        <Grid item xs={12}>
                            <Typography color="text.secondary">{HOME_UI_TEXT.ARTICLES_EMPTY}</Typography>
                        </Grid>
                    )}
                </Grid>
            </Container>

            <Container sx={{ mt: 8, mb: 8 }}>
                <Typography variant="h4" gutterBottom>
                    {HOME_UI_TEXT.FAQ_SECTION_TITLE}
                </Typography>

                <Paper sx={{ p: 4, borderRadius: 4 }}>
                    <Typography variant="h6">{HOME_UI_TEXT.TALK_SPACE_TITLE}</Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        {HOME_UI_TEXT.TALK_SPACE_SUBTITLE}
                    </Typography>

                    <Box sx={{ borderTop: "1px solid #ccc", pt: 2 }}>
                        {topQuestions.length > 0 ? topQuestions.map((question) => (
                            <Box
                                key={question.id}
                                onClick={() => navigate(qnaContentRoute(question.id))}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        navigate(qnaContentRoute(question.id));
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
                                        <strong>{question.author || SHARED_UI_TEXT.UNKNOWN_AUTHOR}</strong>: {question.title || SHARED_UI_TEXT.UNTITLED}
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
                                {HOME_UI_TEXT.QUESTIONS_EMPTY}
                            </Typography>
                        )}
                    </Box>
                </Paper>
            </Container>

        </>
    );
};

export default Home;