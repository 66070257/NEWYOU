import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import ArticleCard from "../components/ArticleCard";
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

const Articles = () => {
    const [articles, setArticles] = useState([]);

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
                            image={article.image || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438"}
                            linkTo={`/articles/${article.id}`}
                        />
                    ))
                ) : (
                    <>
                        <ArticleCard
                            title="เรื่องออกกำลังกายวันแรก ไม่ได้ยากอย่างที่คิด"
                            description="ก่อนหน้านี้ฉันคิดว่าการออกกำลังกายต้องจริงจังและเหนื่อยมาก..."
                            date="Jan 01, 26"
                            author="Argoon"
                            image="https://images.unsplash.com/photo-1517836357463-d25dfeac3438"
                            linkTo="/articles/1"
                        />

                        <ArticleCard
                            title="ตอนเช้าจากเค็มมาก"
                            description="ฉันเคยหยุดออกกำลังกายเพราะเปรียบเทียบตัวเองกับคนอื่น..."
                            date="Jan 02, 26"
                            author="Miss Rachel"
                            image="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"
                            linkTo="/articles/2"
                        />
                    </>
                )}

            </Box>
        </>
    );
};

export default Articles;