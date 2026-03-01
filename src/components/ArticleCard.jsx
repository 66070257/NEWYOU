import React from "react";
import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { IMAGE_FALLBACK_SRC } from "../constants/imageFallback";
import { CARD_UI_TEXT } from "../constants/uiText";
import VoteButton from "./VoteButton";

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
    const normalizedImage = image || "";

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
                flexDirection: "column",
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
            <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
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
                </Box>
                {normalizedImage ? (
                    <Box
                        component="img"
                        src={normalizedImage}
                        alt={CARD_UI_TEXT.ARTICLE_IMAGE_ALT}
                        onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = IMAGE_FALLBACK_SRC;
                        }}
                        sx={{
                            width: "190px",
                            height: "120px",
                            objectFit: "cover",
                            borderRadius: 3
                        }}
                    />
                ) : null}
            </Box>

            <Box
                sx={{
                    mt: 2,
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}
            >
                <Typography variant="caption">
                    {date} &nbsp;&nbsp; <b>{author}</b>
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <VoteButton
                        type="likes"
                        active={liked}
                        count={likes}
                        onClick={handleLikeClick}
                        disabled={!onLike}
                        sx={{ p: "2px 6px" }}
                    />

                    <VoteButton
                        type="dislikes"
                        active={disliked}
                        count={dislikes}
                        onClick={handleDislikeClick}
                        disabled={!onDislike}
                        sx={{ p: "2px 6px" }}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default ArticleCard;