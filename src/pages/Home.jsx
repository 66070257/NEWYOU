import React from "react";
import {
    Typography,
    Container,
    Box,
    Grid,
    Paper
} from "@mui/material";
import HomeArticleCard from "../components/HomeArticleCard";

const Home = () => {
    const articleList = [1, 2, 3];

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

                <Grid container spacing={3}>
                    {articleList.map((item) => (
                        <Grid item xs={12} md={4} key={item}>
                            <HomeArticleCard
                                title="บทความสุขภาพตัวอย่าง"
                                description="เนื้อหาบทความสั้นๆ เกี่ยวกับสุขภาพและการออกกำลังกาย"
                                image="https://images.unsplash.com/photo-1517836357463-d25dfeac3438"
                            />
                        </Grid>
                    ))}
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