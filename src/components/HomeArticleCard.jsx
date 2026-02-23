import React from "react";
import { Box, Button, Card, CardContent, CardMedia, Typography } from "@mui/material";
import { Link } from "react-router-dom";

const LEGACY_DEFAULT_IMAGE_URL = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438";

const HomeArticleCard = ({
    title,
    description,
    image,
    date,
    author,
    likes = 0,
    dislikes = 0,
    onLike,
    onDislike,
    liked = false,
    disliked = false,
    linkTo
}) => {
    const normalizedImage = image === LEGACY_DEFAULT_IMAGE_URL ? "" : image;

    const handleLikeClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        onLike?.();
    };

    const handleDislikeClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        onDislike?.();
    };

    return (
        <Card
            component={linkTo ? Link : "div"}
            to={linkTo}
            sx={{
                borderRadius: 4,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                textDecoration: "none",
                color: "inherit",
                cursor: linkTo ? "pointer" : "default",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": linkTo
                    ? {
                        transform: "translateY(-2px)",
                        boxShadow: 4
                    }
                    : {}
            }}
        >
            <CardContent sx={{ flexGrow: 1 }}>
                <Typography
                    variant="h6"
                    sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight: "64px"
                    }}
                >
                    {title}
                </Typography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight: "80px"
                    }}
                >
                    {description}
                </Typography>
            </CardContent>

            {normalizedImage ? (
                <CardMedia
                    component="img"
                    height="180"
                    image={normalizedImage}
                    alt="article"
                    sx={{
                        width: "90%",
                        mx: "auto",
                        pb: 2,
                        borderRadius: 2
                    }}
                />
            ) : null}

            <Box sx={{ px: 2, pb: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                    {date || "-"} &nbsp;&nbsp; <b>{author || "Unknown"}</b>
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
                    <Button
                        size="small"
                        onClick={handleLikeClick}
                        disabled={!onLike}
                        sx={{
                            minWidth: 0,
                            p: 0,
                            textTransform: "none",
                            color: liked ? "#1976d2" : "inherit",
                            fontWeight: liked ? 700 : 400
                        }}
                    >
                        LIKE {likes}
                    </Button>
                    <Button
                        size="small"
                        onClick={handleDislikeClick}
                        disabled={!onDislike}
                        sx={{
                            minWidth: 0,
                            p: 0,
                            textTransform: "none",
                            color: disliked ? "#d32f2f" : "inherit",
                            fontWeight: disliked ? 700 : 400
                        }}
                    >
                        DISLIKE {dislikes}
                    </Button>
                </Box>
            </Box>
        </Card>
    );
};

export default HomeArticleCard;
