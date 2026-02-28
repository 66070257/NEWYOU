import React from "react";
import { Box, IconButton, Typography } from "@mui/material";
import FacebookOutlinedIcon from "@mui/icons-material/FacebookOutlined";
import YouTubeIcon from "@mui/icons-material/YouTube";
import InstagramIcon from "@mui/icons-material/Instagram";
import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <Box>
            <Box
                sx={{
                    backgroundColor: "#F8F9FA",
                    py: 4,
                    textAlign: "center"
                }}
            >
                <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 1.5 }}>
                    <IconButton size="small" sx={{ color: "#333333" }}>
                        <FacebookOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" sx={{ color: "#333333" }}>
                        <YouTubeIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" sx={{ color: "#333333" }}>
                        <InstagramIcon fontSize="small" />
                    </IconButton>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "center", gap: 5, flexWrap: "wrap" }}>
                    <Typography component={Link} to="/" sx={footerLinkStyle}>Home</Typography>
                    <Typography component={Link} to="/articles" sx={footerLinkStyle}>Articles</Typography>
                    <Typography component={Link} to="/qna" sx={footerLinkStyle}>Q&A</Typography>
                    <Typography component={Link} to="/profile" sx={footerLinkStyle}>Profile</Typography>
                    <Typography component={Link} to="/login" sx={footerLinkStyle}>Login</Typography>
                </Box>
            </Box>

            <Box sx={{ backgroundColor: "#333333", py: 1.2, textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "#EAEAEA" }}>
                    Copyright © 2026 NEW YOU. All rights reserved.
                </Typography>
            </Box>
        </Box>
    );
};

const footerLinkStyle = {
    color: "#333333",
    textDecoration: "none",
    fontSize: "1rem",
    "&:hover": {
        textDecoration: "underline"
    }
};

export default Footer;
