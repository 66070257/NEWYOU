import React, { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../database/firebase";
import useImageUpload from "../hooks/useImageUpload";

const NewPost = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const {
        imageUrl,
        imageInputValue,
        previewSrc,
        hasImage,
        isUploadingImage,
        fileInputRef,
        handlePickImage,
        handleUploadImage,
        handleRemoveImage,
        setImageUrlFromInput
    } = useImageUpload({ folderName: "articles", mode: "local-server" });

    const handleCreate = async () => {
        if (!db) {
            alert("Firebase ยังไม่ถูกตั้งค่า กรุณาใส่ค่าใน .env ก่อน");
            return;
        }

        if (!title.trim() || !content.trim()) {
            alert("กรุณากรอก Title และ Content");
            return;
        }

        try {
            setIsSaving(true);
            const currentUser = auth.currentUser;

            if (!currentUser) {
                alert("กรุณาเข้าสู่ระบบก่อนสร้างโพสต์");
                setIsSaving(false);
                navigate("/login");
                return;
            }

            await addDoc(collection(db, "articles"), {
                title: title.trim(),
                description: content.trim(),
                content: content.trim(),
                image: imageUrl.trim() || "",
                uid: currentUser.uid,
                author: currentUser.displayName || currentUser.email || "Unknown",
                handle: currentUser.email ? `@${currentUser.email.split("@")[0]}` : "@user",
                likes: 0,
                dislikes: 0,
                createdAt: serverTimestamp()
            });

            navigate("/articles");
        } catch (error) {
            alert("บันทึกบทความไม่สำเร็จ");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundColor: "#efefef",
                pt: 12,
                pb: 6,
                px: 2
            }}
        >
            <Box
                sx={{
                    width: "100%",
                    maxWidth: "960px",
                    minHeight: "720px",
                    mx: "auto",
                    backgroundColor: "#f6f6f6",
                    borderRadius: "16px",
                    boxShadow: 2,
                    px: { xs: 3, md: 8 },
                    py: 6
                }}
            >
                <Typography
                    sx={{
                        textAlign: "center",
                        fontSize: { xs: "56px", md: "64px" },
                        fontWeight: 600,
                        mb: 8
                    }}
                >
                    New Article
                </Typography>

                <Box sx={{ width: "100%", maxWidth: "520px", ml: { md: 2 } }}>
                    <TextField
                        fullWidth
                        variant="standard"
                        placeholder="Title..."
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        InputProps={{ disableUnderline: false }}
                        sx={{ mb: 3 }}
                    />

                    <TextField
                        fullWidth
                        variant="standard"
                        multiline
                        minRows={1}
                        placeholder="Content..."
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        InputProps={{ disableUnderline: false }}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        variant="standard"
                        placeholder="Image URL (optional)..."
                        value={imageInputValue}
                        onChange={(event) => setImageUrlFromInput(event.target.value)}
                        InputProps={{ disableUnderline: false }}
                        sx={{ mt: 2 }}
                    />

                    <Box sx={{ mt: 8, display: "flex", alignItems: "center", gap: 3 }}>
                        <Box
                            sx={{
                                width: "210px",
                                height: "140px",
                                borderRadius: "16px",
                                backgroundColor: "#d5d5d5",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden"
                            }}
                        >
                            {previewSrc ? (
                                <Box
                                    component="img"
                                    src={previewSrc}
                                    alt="Article"
                                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                <ImageOutlinedIcon sx={{ fontSize: 54, color: "#111" }} />
                            )}
                        </Box>
                        <Button
                            onClick={hasImage ? handleRemoveImage : handlePickImage}
                            disabled={isSaving}
                            sx={{
                                ml: 2,
                                minWidth: 0,
                                border: hasImage ? "2px solid #d32f2f" : "2px solid black",
                                color: hasImage ? "#d32f2f" : "inherit",
                                borderRadius: "50%",
                                width: 40,
                                height: 40
                            }}
                        >
                            {hasImage ? <DeleteOutlineIcon /> : <AddIcon />}
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleUploadImage}
                        />
                    </Box>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 5 }}>
                    <Button
                        variant="outlined"
                        onClick={handleCreate}
                        disabled={isSaving || isUploadingImage}
                        sx={{
                            borderColor: "#111",
                            color: "#111",
                            borderRadius: "999px",
                            textTransform: "none",
                            px: 2.5,
                            py: "2px",
                            minWidth: "82px",
                            fontWeight: 700
                        }}
                    >
                        {isSaving ? "Saving..." : isUploadingImage ? "Uploading image..." : "Create"}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default NewPost;
