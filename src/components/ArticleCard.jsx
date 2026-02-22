import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";

const ArticleCard = ({ title, description, date, author, image, linkTo }) => {
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#f5f5f5",
                padding: 3,
                borderRadius: 3,
                boxShadow: 1,
                mb: 3
            }}
        >
            {/* Text */}
            <Box sx={{ width: "65%" }}>
                <Typography
                    component={linkTo ? Link : "h6"}
                    to={linkTo}
                    variant="h6"
                    fontWeight="bold"
                    sx={{ color: "inherit", textDecoration: "none" }}
                >
                    {title}
                </Typography>

                <Typography variant="body2" sx={{ mt: 1 }}>
                    {description}
                </Typography>

                <Box
                    sx={{
                        mt: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                    }}
                >
                    <Typography variant="caption">
                        {date} &nbsp;&nbsp; <b>{author}</b>
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Button size="small" variant="text" sx={{ minWidth: 0, p: "2px 6px", textTransform: "none" }}>
                            LIKE 00
                        </Button>
                        
                        <Button size="small" variant="text" sx={{ minWidth: 0, p: "2px 6px", textTransform: "none" }}>
                            DISLIKE 00
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* Image */}
            {linkTo ? (
                <Box component={Link} to={linkTo} sx={{ textDecoration: "none" }}>
                    <Box
                        component="img"
                        src={image}
                        alt="article"
                        sx={{
                            width: "250px",
                            height: "160px",
                            objectFit: "cover",
                            borderRadius: 3
                        }}
                    />
                </Box>
            ) : (
                <Box
                    component="img"
                    src={image}
                    alt="article"
                    sx={{
                        width: "250px",
                        height: "160px",
                        objectFit: "cover",
                        borderRadius: 3
                    }}
                />
            )}
        </Box>
    );
};

export default ArticleCard;