import React, { useState } from "react";
import { Box, Button, Link, TextField, Typography } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../database/firebase";
import { ALERT_MESSAGES } from "../constants/messages";
import { APP_ROUTES } from "../constants/routes";
import { AUTH_UI_TEXT } from "../constants/uiText";

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const getLoginErrorMessage = (code) => {
        return AUTH_UI_TEXT.LOGIN.ERROR_BY_CODE[code]
            || `${AUTH_UI_TEXT.LOGIN.ERROR_FALLBACK_PREFIX} (${code || "unknown"})`;
    };

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            alert(ALERT_MESSAGES.LOGIN_MISSING_FIELDS);
            return;
        }

        try {
            setIsLoading(true);
            await signInWithEmailAndPassword(auth, email.trim(), password);
            navigate(APP_ROUTES.HOME);
        } catch (error) {
            alert(getLoginErrorMessage(error?.code));
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
                    pb: 4,
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
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    px: 6,
                    pt: 2,
                    pb: 6
                }}
            >
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                    <Typography
                        sx={{
                            fontSize: { xs: "54px", md: "74px" },
                            letterSpacing: "1px",
                            lineHeight: 1,
                            fontWeight: 500,
                            mb: 10
                        }}
                    >
                        {AUTH_UI_TEXT.BRAND_TITLE}
                    </Typography>

                    <Box sx={{ width: "100%", maxWidth: "440px" }}>
                        <TextField
                            fullWidth
                            variant="standard"
                            type="email"
                            placeholder={AUTH_UI_TEXT.LOGIN.EMAIL_PLACEHOLDER}
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            InputProps={{ disableUnderline: false }}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            type="password"
                            variant="standard"
                            placeholder={AUTH_UI_TEXT.LOGIN.PASSWORD_PLACEHOLDER}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            InputProps={{ disableUnderline: false }}
                        />

                        <Box sx={{ textAlign: "right", mt: 1 }}>
                            <Link
                                component={RouterLink}
                                to={APP_ROUTES.REGISTER}
                                underline="hover"
                                color="inherit"
                                sx={{ fontSize: "11px" }}
                            >
                                {AUTH_UI_TEXT.LOGIN.CREATE_ACCOUNT_LINK}
                            </Link>
                        </Box>

                        <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                            <Button
                                variant="outlined"
                                onClick={handleLogin}
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
                                {isLoading ? AUTH_UI_TEXT.LOGIN.LOADING : AUTH_UI_TEXT.LOGIN.SUBMIT}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Box>
            </Box>
        </>
    );
};

export default Login;
