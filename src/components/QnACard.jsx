import React from "react";
import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import VoteButton from "./VoteButton";

const QnACard = ({
    title,
    date,
    author,
    linkTo,
    likes = 0,
    dislikes = 0,
    onLike,
    onDislike,
    liked = false,
    disliked = false
}) => {
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
                backgroundColor: "#f5f5f5",
                padding: "10px 16px",
                borderRadius: "16px",
                boxShadow: 1,
                mb: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
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
            <Typography
                component="p"
                variant="body1"
                sx={{
                    flex: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    color: "inherit",
                    textDecoration: "none"
                }}
            >
                <Box component="span" sx={{ fontWeight: "bold", mr: 1 }}>
                    {author}:
                </Box>
                {title}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {date}
                </Typography>

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
    );
};

export default QnACard;
