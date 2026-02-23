import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";

const LEGACY_DEFAULT_IMAGE_URL = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438";

const ArticleCard = ({
    title,
    description,
    date,
    author,
    image,
    linkTo,
    likes = 0,
    dislikes = 0,
    onLike,
    onDislike,
    liked = false,
    disliked = false
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
        <Box
            component={linkTo ? Link : "div"}
            to={linkTo}
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#f5f5f5",
                padding: 3,
                borderRadius: 3,
                boxShadow: 1,
                mb: 3,
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
            {/* Text */}
            <Box sx={{ width: normalizedImage ? "65%" : "100%" }}>
                <Typography
                    component="h6"
                    variant="h6"
                    fontWeight="bold"
                    sx={{ color: "inherit", textDecoration: "none" }}
                >
                    {title}
                </Typography>

                <Typography
                    variant="body2"
                    sx={{
                        mt: 1,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                    }}
                >
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
                        <Button
                            size="small"
                            variant="text"
                            onClick={handleLikeClick}
                            disabled={!onLike}
                            sx={{
                                minWidth: 0,
                                p: "2px 6px",
                                textTransform: "none",
                                color: liked ? "#1976d2" : "inherit",
                                fontWeight: liked ? 700 : 400
                            }}
                        >
                            LIKE {likes}
                        </Button>
                        
                        <Button
                            size="small"
                            variant="text"
                            onClick={handleDislikeClick}
                            disabled={!onDislike}
                            sx={{
                                minWidth: 0,
                                p: "2px 6px",
                                textTransform: "none",
                                color: disliked ? "#d32f2f" : "inherit",
                                fontWeight: disliked ? 700 : 400
                            }}
                        >
                            DISLIKE {dislikes}
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* Image */}
            {normalizedImage ? (
                <Box
                    component="img"
                    src={normalizedImage}
                    alt="article"
                    sx={{
                        width: "250px",
                        height: "160px",
                        objectFit: "cover",
                        borderRadius: 3
                    }}
                />
            ) : null}
        </Box>
    );
};

export default ArticleCard;