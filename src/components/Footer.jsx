import React from "react";
import { Box, IconButton, Typography } from "@mui/material";
import FacebookOutlinedIcon from "@mui/icons-material/FacebookOutlined";
import YouTubeIcon from "@mui/icons-material/YouTube";
import InstagramIcon from "@mui/icons-material/Instagram";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "../constants/routes";
import { FOOTER_UI_TEXT, NAV_UI_TEXT } from "../constants/uiText";

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
                    <Typography component={Link} to={APP_ROUTES.HOME} sx={footerLinkStyle}>{NAV_UI_TEXT.HOME}</Typography>
                    <Typography component={Link} to={APP_ROUTES.ARTICLES} sx={footerLinkStyle}>{NAV_UI_TEXT.ARTICLES}</Typography>
                    <Typography component={Link} to={APP_ROUTES.QNA} sx={footerLinkStyle}>{NAV_UI_TEXT.QNA}</Typography>
                    <Typography component={Link} to={APP_ROUTES.PROFILE} sx={footerLinkStyle}>{NAV_UI_TEXT.PROFILE}</Typography>
                    <Typography component={Link} to={APP_ROUTES.LOGIN} sx={footerLinkStyle}>{NAV_UI_TEXT.LOGIN}</Typography>
                </Box>
            </Box>

            <Box sx={{ backgroundColor: "#333333", py: 1.2, textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "#EAEAEA" }}>
                    {FOOTER_UI_TEXT.COPYRIGHT}
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
