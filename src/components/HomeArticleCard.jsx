import React from "react";
import { Box, Card, CardContent, CardMedia, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { IMAGE_FALLBACK_SRC } from "../constants/imageFallback";
import { CARD_UI_TEXT } from "../constants/uiText";
import VoteButton from "./VoteButton";

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
    const normalizedImage = image || "";
    const hasImage = Boolean(normalizedImage);

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
                        WebkitLineClamp: hasImage ? 4 : 10,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight: hasImage ? "80px" : "260px"
                    }}
                >
                    {description}
                </Typography>
            </CardContent>

            {hasImage ? (
                <CardMedia
                    component="img"
                    height="180"
                    image={normalizedImage}
                    alt={CARD_UI_TEXT.ARTICLE_IMAGE_ALT}
                    onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = IMAGE_FALLBACK_SRC;
                    }}
                    sx={{
                        width: "90%",
                        mx: "auto",
                        pb: 2,
                        borderRadius: 2
                    }}
                />
            ) : null}

            <Box sx={{ px: 2, pb: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                        flex: 1,
                        minWidth: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                    }}
                >
                    {date || "-"} &nbsp;&nbsp; <b>{author || CARD_UI_TEXT.AUTHOR_FALLBACK}</b>
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
                    <VoteButton
                        type="likes"
                        active={liked}
                        count={likes}
                        onClick={handleLikeClick}
                        disabled={!onLike}
                    />
                    <VoteButton
                        type="dislikes"
                        active={disliked}
                        count={dislikes}
                        onClick={handleDislikeClick}
                        disabled={!onDislike}
                    />
                </Box>
            </Box>
        </Card>
    );
};

export default HomeArticleCard;
