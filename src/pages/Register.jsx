import React, { useState } from "react";
import { Box, Button, Link, TextField, Typography } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../database/firebase";
import { FIRESTORE_COLLECTIONS } from "../constants/collections";
import { ALERT_MESSAGES } from "../constants/messages";
import { APP_ROUTES } from "../constants/routes";
import { AUTH_UI_TEXT } from "../constants/uiText";

const Register = () => {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const getRegisterErrorMessage = (code) => {
        return AUTH_UI_TEXT.REGISTER.ERROR_BY_CODE[code]
            || `${AUTH_UI_TEXT.REGISTER.ERROR_FALLBACK_PREFIX} (${code || "unknown"})`;
    };

    const handleRegister = async () => {
        if (!name.trim() || !email.trim() || !password.trim()) {
            alert(ALERT_MESSAGES.REGISTER_MISSING_FIELDS);
            return;
        }

        try {
            setIsLoading(true);
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
            await updateProfile(userCredential.user, {
                displayName: name.trim()
            });

            await setDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, userCredential.user.uid), {
                uid: userCredential.user.uid,
                name: name.trim(),
                email: email.trim(),
                createdAt: serverTimestamp()
            });

            navigate(APP_ROUTES.HOME);
        } catch (error) {
            alert(getRegisterErrorMessage(error?.code));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    pt: 15,
                    pb: 4
                }}
            >
                <Box
                    sx={{
                        width: "100%",
                        maxWidth: "920px",
                        minHeight: "680px",
                        backgroundColor: "#f6f6f6",
                        borderRadius: 2,
                        boxShadow: 2,
                        px: 6,
                        pt: 2,
                        pb: 6
                    }}
                >
                    <Box sx={{ mt: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <Typography
                            sx={{
                                fontSize: { xs: "54px", md: "74px" },
                                letterSpacing: "1px",
                                lineHeight: 1,
                                fontWeight: 500,
                                mb: 8
                            }}
                        >
                            {AUTH_UI_TEXT.REGISTER.TITLE}
                        </Typography>

                        <Box sx={{ width: "100%", maxWidth: "440px" }}>
                            <TextField
                                fullWidth
                                variant="standard"
                                placeholder={AUTH_UI_TEXT.REGISTER.NAME_PLACEHOLDER}
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                type="email"
                                variant="standard"
                                placeholder={AUTH_UI_TEXT.REGISTER.EMAIL_PLACEHOLDER}
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                type="password"
                                variant="standard"
                                placeholder={AUTH_UI_TEXT.REGISTER.PASSWORD_PLACEHOLDER}
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                            />

                            <Box sx={{ textAlign: "right", mt: 1 }}>
                                <Link component={RouterLink} to={APP_ROUTES.LOGIN} underline="hover" color="inherit" sx={{ fontSize: "11px" }}>
                                    {AUTH_UI_TEXT.REGISTER.LOGIN_LINK}
                                </Link>
                            </Box>

                            <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                                <Button
                                    variant="outlined"
                                    onClick={handleRegister}
                                    disabled={isLoading}
                                    sx={{
                                        color: "black",
                                        borderRadius: "999px",
                                        border: "2px solid black",
                                        textTransform: "none",
                                        px: 3,
                                        py: "3px",
                                        fontSize: "12px",
                                        minWidth: "84px"
                                    }}
                                >
                                    {isLoading ? AUTH_UI_TEXT.REGISTER.LOADING : AUTH_UI_TEXT.REGISTER.SUBMIT}
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default Register;
