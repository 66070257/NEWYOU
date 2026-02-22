import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";

const QnACard = ({ title, date, author, linkTo }) => {
    return (
        <Box
            sx={{
                backgroundColor: "#f5f5f5",
                padding: "10px 16px",
                borderRadius: "16px",
                boxShadow: 1,
                mb: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2
            }}
        >
            <Typography
                component={linkTo ? Link : "p"}
                to={linkTo}
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

                <Button size="small" variant="text" sx={{ minWidth: 0, p: "2px 6px", textTransform: "none" }}>
                    LIKE 13
                </Button>
                <Button size="small" variant="text" sx={{ minWidth: 0, p: "2px 6px", textTransform: "none" }}>
                    DISLIKE 00
                </Button>
            </Box>
        </Box>
    );
};

export default QnACard;
