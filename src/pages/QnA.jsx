import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import QnACard from "../components/QnACard";
import { db } from "../database/firebase";

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
                            linkTo={`/qna/${question.id}`}
                        />
                    ))
                ) : (
                    <>
                        <QnACard
                            title="เรื่องออกกำลังกายวันแรก ไม่ได้ยากอย่างที่คิด"
                            date="Jan 01, 26"
                            author="Argoon"
                            linkTo="/qna/1"
                        />

                        <QnACard
                            title="ตอนเช้าจากเค็มมาก"
                            date="Jan 02, 26"
                            author="Miss Rachel"
                            linkTo="/qna/2"
                        />
                    </>
                )}

            </Box>
        </>
    );
};

export default QnA;