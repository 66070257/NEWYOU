import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../database/firebase";

const ProtectedRoute = ({ children }) => {
    const [isChecking, setIsChecking] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsChecking(false);
        });

        return () => unsubscribe();
    }, []);

    if (isChecking) {
        return (
            <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
