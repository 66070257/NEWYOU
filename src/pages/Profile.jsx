import React, { useEffect, useState } from "react";
import { Box, FormControl, MenuItem, Select, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, increment, onSnapshot, query, runTransaction, serverTimestamp, where } from "firebase/firestore";
import ArticleCard from "../components/ArticleCard";
import QnACard from "../components/QnACard";
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

const Profile = () => {
    const [postType, setPostType] = useState("Articles");
    const [currentUser, setCurrentUser] = useState(null);
    const [myArticles, setMyArticles] = useState([]);
    const [myQuestions, setMyQuestions] = useState([]);
    const [articleReactions, setArticleReactions] = useState({});
    const [questionReactions, setQuestionReactions] = useState({});

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!currentUser) {
            setMyArticles([]);
            return undefined;
        }

        const articlesQuery = query(collection(db, "articles"), where("uid", "==", currentUser.uid));

        const unsubscribe = onSnapshot(articlesQuery, (snapshot) => {
            const items = snapshot.docs.map((docItem) => ({
                id: docItem.id,
                ...docItem.data()
            }));
            setMyArticles(items);
        });

        return () => unsubscribe();
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) {
            setMyQuestions([]);
            return undefined;
        }

        const questionsQuery = query(collection(db, "questions"), where("uid", "==", currentUser.uid));

        const unsubscribe = onSnapshot(questionsQuery, (snapshot) => {
            const items = snapshot.docs.map((docItem) => ({
                id: docItem.id,
                ...docItem.data()
            }));
            setMyQuestions(items);
        });

        return () => unsubscribe();
    }, [currentUser]);

    useEffect(() => {
        if (!db || !currentUser || myArticles.length === 0) {
            setArticleReactions({});
            return undefined;
        }

        const unsubscribers = myArticles.map((article) => {
            const reactionRef = doc(db, "articles", article.id, "reactions", currentUser.uid);

            return onSnapshot(reactionRef, (reactionSnap) => {
                setArticleReactions((previous) => ({
                    ...previous,
                    [article.id]: reactionSnap.exists() ? reactionSnap.data()?.type : null
                }));
            });
        });

        return () => {
            unsubscribers.forEach((unsubscribe) => unsubscribe());
        };
    }, [currentUser, myArticles]);

    useEffect(() => {
        if (!db || !currentUser || myQuestions.length === 0) {
            setQuestionReactions({});
            return undefined;
        }

        const unsubscribers = myQuestions.map((question) => {
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
    }, [currentUser, myQuestions]);

    const handlePostReaction = async (collectionName, postId, field) => {
        if (!currentUser) {
            alert("กรุณาเข้าสู่ระบบก่อนกดโหวต");
            return;
        }

        try {
            const postRef = doc(db, collectionName, postId);
            const reactionRef = doc(db, collectionName, postId, "reactions", currentUser.uid);

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

    const displayName = currentUser?.displayName || "User";
    const handle = currentUser?.email ? `@${currentUser.email.split("@")[0]}` : "@user";

    return (
        <Box
            sx={{
                mt: 15,
                width: "90%",
                maxWidth: "1100px",
                margin: "0 auto",
                paddingTop: "100px"
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontSize: { xs: "48px", md: "64px" }, fontWeight: 700, lineHeight: 1 }}>
                    {displayName}
                </Typography>
                <MoreHorizIcon sx={{ fontSize: 30, color: "text.secondary" }} />
            </Box>

            <Typography sx={{ mt: 2, color: "text.secondary", fontSize: "32px" }}>
                {handle}
            </Typography>

            <Box sx={{ mt: 3, mb: 4, display: "flex", justifyContent: "flex-end" }}>
                <FormControl size="small">
                    <Select
                        value={postType}
                        onChange={(event) => setPostType(event.target.value)}
                        IconComponent={ExpandMoreIcon}
                        sx={{
                            borderRadius: "999px",
                            color: "black",
                            minWidth: "140px",
                            height: "36px",
                            "& .MuiSelect-select": {
                                py: 0.5,
                                px: 2
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "black"
                            }
                        }}
                    >
                        <MenuItem value="Articles">Articles</MenuItem>
                        <MenuItem value="Q&A">Q&A</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {postType === "Articles" ? (
                <>
                    {myArticles.length > 0 ? (
                        myArticles.map((article) => (
                            <ArticleCard
                                key={article.id}
                                title={article.title}
                                description={article.description || article.content}
                                date={formatDate(article.createdAt)}
                                author={article.author || displayName}
                                image={article.image}
                                likes={article.likes ?? 0}
                                dislikes={article.dislikes ?? 0}
                                liked={articleReactions[article.id] === "likes"}
                                disliked={articleReactions[article.id] === "dislikes"}
                                onLike={() => handlePostReaction("articles", article.id, "likes")}
                                onDislike={() => handlePostReaction("articles", article.id, "dislikes")}
                                linkTo={`/articles/${article.id}`}
                            />
                        ))
                    ) : (
                        <Typography color="text.secondary">ยังไม่มีบทความของคุณ</Typography>
                    )}
                </>
            ) : (
                <>
                    {myQuestions.length > 0 ? (
                        myQuestions.map((question) => (
                            <QnACard
                                key={question.id}
                                title={question.title}
                                date={formatDate(question.createdAt)}
                                author={question.author || displayName}
                                likes={question.likes ?? 0}
                                dislikes={question.dislikes ?? 0}
                                liked={questionReactions[question.id] === "likes"}
                                disliked={questionReactions[question.id] === "dislikes"}
                                onLike={() => handlePostReaction("questions", question.id, "likes")}
                                onDislike={() => handlePostReaction("questions", question.id, "dislikes")}
                                linkTo={`/qna/${question.id}`}
                            />
                        ))
                    ) : (
                        <Typography color="text.secondary">ยังไม่มีคำถามของคุณ</Typography>
                    )}
                </>
            )}
        </Box>
    );
};

export default Profile;
