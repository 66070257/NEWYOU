import React, { useEffect, useState } from "react";
import { Box, FormControl, MenuItem, Select, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
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

    const displayName = currentUser?.displayName || "User";
    const handle = currentUser?.email ? `@${currentUser.email.split("@")[0]}` : "@user";

    return (
        <Box
            sx={{
                mt: 15,
                width: "90%",
                maxWidth: "1100px",
                margin: "0 auto",
                paddingTop: "70px"
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
                                image={article.image || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438"}
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
