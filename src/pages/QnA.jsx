import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import { collection, doc, increment, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from "firebase/firestore";
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

const QnA = () => {
    const [questions, setQuestions] = useState([]);
    const [postReactions, setPostReactions] = useState({});

    const handlePostReaction = async (questionId, field) => {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            alert("กรุณาเข้าสู่ระบบก่อนกดโหวต");
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
            alert("อัปเดตคะแนนโพสต์ไม่สำเร็จ");
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

                    <Button
                        component={Link}
                        to="/new-post-qna"
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

                {/* Q&A List */}
                {questions.length > 0 ? (
                    questions.map((question) => (
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
                    <Typography color="text.secondary">ยังไม่มีคำถาม</Typography>
                )}

            </Box>
        </>
    );
};

export default QnA;