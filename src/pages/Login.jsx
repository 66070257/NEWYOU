import React, { useState } from "react";
import { Box, Button, Link, TextField, Typography } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../database/firebase";

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const getLoginErrorMessage = (code) => {
        switch (code) {
        case "auth/configuration-not-found":
            return "ยังไม่ได้เปิด Email/Password ใน Firebase Authentication";
        case "auth/invalid-email":
            return "รูปแบบอีเมลไม่ถูกต้อง";
        case "auth/invalid-credential":
            return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
        case "auth/user-not-found":
            return "ไม่พบบัญชีผู้ใช้นี้";
        case "auth/wrong-password":
            return "รหัสผ่านไม่ถูกต้อง";
        default:
            return `เข้าสู่ระบบไม่สำเร็จ (${code || "unknown"})`;
        }
    };

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            alert("กรุณากรอก Email และ Password");
            return;
        }

        try {
            setIsLoading(true);
            await signInWithEmailAndPassword(auth, email.trim(), password);
            navigate("/");
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
                            mb: 10
                        }}
                    >
                        NEW YOU.
                    </Typography>

                    <Box sx={{ width: "100%", maxWidth: "440px" }}>
                        <TextField
                            fullWidth
                            variant="standard"
                            type="email"
                            placeholder="Email..."
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            InputProps={{ disableUnderline: false }}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            type="password"
                            variant="standard"
                            placeholder="Password..."
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            InputProps={{ disableUnderline: false }}
                        />

                        <Box sx={{ textAlign: "right", mt: 1 }}>
                            <Link
                                component={RouterLink}
                                to="/register"
                                underline="hover"
                                color="inherit"
                                sx={{ fontSize: "11px" }}
                            >
                                No account? Create one
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
                                {isLoading ? "Loading..." : "Login"}
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
