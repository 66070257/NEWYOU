import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { Box, Button } from "@mui/material";
import { auth } from "../database/firebase";

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
                    border: "2px solid black",
                    borderRadius: "40px",
                    backgroundColor: "rgba(255,255,255,0.3)",
                    backdropFilter: "blur(6px)"
                }}
            >
                <Button component={Link} to="/" sx={navStyle}>
                    Home
                </Button>

                <Button component={Link} to="/articles" sx={navStyle}>
                    Articles
                </Button>

                <Button component={Link} to="/qna" sx={navStyle}>
                    Q&A
                </Button>
                <Button component={Link} to="/profile" sx={navStyle}>
                    Profile
                </Button>
                {isLoggedIn ? (
                    <Button onClick={handleLogout} sx={navStyle}>
                        Logout
                    </Button>
                ) : (
                    <Button component={Link} to="/login" sx={navStyle}>
                        Login
                    </Button>
                )}
            </Box>
        </Box>
    );
};

const navStyle = {
    padding: "0px 10px",
    color: "black",
    fontWeight: "bold",
    textTransform: "none",
    fontSize: "18px",
    "&:hover": {
        backgroundColor: "rgba(0,0,0,0.1)",
        borderRadius: "20px"
    }
};

export default Navbar;