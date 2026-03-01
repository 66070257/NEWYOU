import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { Box, Button } from "@mui/material";
import { auth } from "../database/firebase";
import { APP_ROUTES } from "../constants/routes";
import { NAV_UI_TEXT } from "../constants/uiText";

const Navbar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(Boolean(user));
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
    };

    return (
        <Box
            sx={{
                position: "fixed",
                top: 20,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                zIndex: 1000
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "90%",
                    maxWidth: "1200px",
                    padding: "5px 30px",
                    border: "1px solid #EAEAEA",
                    borderRadius: "40px",
                    backgroundColor: "rgba(255,255,255,0.88)",
                    backdropFilter: "blur(6px)"
                }}
            >
                <Button component={Link} to={APP_ROUTES.HOME} sx={navStyle}>
                    {NAV_UI_TEXT.HOME}
                </Button>

                <Button component={Link} to={APP_ROUTES.ARTICLES} sx={navStyle}>
                    {NAV_UI_TEXT.ARTICLES}
                </Button>

                <Button component={Link} to={APP_ROUTES.QNA} sx={navStyle}>
                    {NAV_UI_TEXT.QNA}
                </Button>
                <Button component={Link} to={APP_ROUTES.PROFILE} sx={navStyle}>
                    {NAV_UI_TEXT.PROFILE}
                </Button>
                {isLoggedIn ? (
                    <Button onClick={handleLogout} sx={navStyle}>
                        {NAV_UI_TEXT.LOGOUT}
                    </Button>
                ) : (
                    <Button component={Link} to={APP_ROUTES.LOGIN} sx={navStyle}>
                        {NAV_UI_TEXT.LOGIN}
                    </Button>
                )}
            </Box>
        </Box>
    );
};

const navStyle = {
    padding: "0px 10px",
    color: "#333333",
    fontWeight: "bold",
    textTransform: "none",
    fontSize: "18px",
    "&:hover": {
        backgroundColor: "#EAEAEA",
        borderRadius: "20px"
    }
};

export default Navbar;