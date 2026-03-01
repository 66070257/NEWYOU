import React, { useEffect, useRef, useState } from "react";
import { Box, Button, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../database/firebase";
import useImageUpload from "../hooks/useImageUpload";
import CircleIconButton from "../components/CircleIconButton";
import { FIRESTORE_COLLECTIONS, getCollectionByPostType } from "../constants/collections";
import { ALERT_MESSAGES } from "../constants/messages";
import { APP_ROUTES, articleContentRoute, qnaContentRoute } from "../constants/routes";
import { POST_EDITOR_UI_TEXT, SHARED_UI_TEXT } from "../constants/uiText";

const EditPost = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { postType: routePostType, id: postId } = useParams();
    const [title, setTitle] = useState("");
    const [bodyText, setBodyText] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const initializedPostIdRef = useRef(null);

    const editState = location.state;
    const normalizedRouteType = routePostType === "qna" ? "qna" : "article";
    const hasPostId = Boolean(postId);
    const [postType, setPostType] = useState(editState?.postType === "qna" ? "qna" : normalizedRouteType);

    const {
        imageUrl: articleImageUrl,
        imageInputValue: articleImageInputValue,
        previewSrc: articlePreviewSrc,
        hasImage: hasArticleImage,
        isUploadingImage: isUploadingArticleImage,
        fileInputRef: articleFileInputRef,
        handlePickImage: handlePickArticleImage,
        handleUploadImage: handleUploadArticleImage,
        handleRemoveImage: handleRemoveArticleImage,
        setImageUrlFromInput: setArticleImageUrlFromInput
    } = useImageUpload({ folderName: FIRESTORE_COLLECTIONS.ARTICLES, mode: "local-server" });

    const {
        imageUrl: questionImageUrl,
        imageInputValue: questionImageInputValue,
        previewSrc: questionPreviewSrc,
        hasImage: hasQuestionImage,
        isUploadingImage: isUploadingQuestionImage,
        fileInputRef: questionFileInputRef,
        handlePickImage: handlePickQuestionImage,
        handleUploadImage: handleUploadQuestionImage,
        handleRemoveImage: handleRemoveQuestionImage,
        setImageUrlFromInput: setQuestionImageUrlFromInput
    } = useImageUpload({ folderName: FIRESTORE_COLLECTIONS.QUESTIONS, mode: "local-server" });

    const isQnA = postType === "qna";
    const imageUrl = isQnA ? questionImageUrl : articleImageUrl;
    const imageInputValue = isQnA ? questionImageInputValue : articleImageInputValue;
    const previewSrc = isQnA ? questionPreviewSrc : articlePreviewSrc;
    const hasImage = isQnA ? hasQuestionImage : hasArticleImage;
    const isUploadingImage = isQnA ? isUploadingQuestionImage : isUploadingArticleImage;
    const fileInputRef = isQnA ? questionFileInputRef : articleFileInputRef;
    const handlePickImage = isQnA ? handlePickQuestionImage : handlePickArticleImage;
    const handleUploadImage = isQnA ? handleUploadQuestionImage : handleUploadArticleImage;
    const handleRemoveImage = isQnA ? handleRemoveQuestionImage : handleRemoveArticleImage;
    const setImageUrlFromInput = isQnA ? setQuestionImageUrlFromInput : setArticleImageUrlFromInput;

    useEffect(() => {
        if (!hasPostId) {
            navigate(APP_ROUTES.NEW_POST, { replace: true });
            return;
        }

        if (initializedPostIdRef.current === postId) {
            return;
        }

        initializedPostIdRef.current = postId;

        const loadPost = async () => {
            const stateType = editState?.postType === "qna" ? "qna" : "article";
            const currentType = editState?.postType ? stateType : normalizedRouteType;

            setPostType(currentType);

            if (editState?.initialData) {
                setTitle(editState.initialData.title || "");
                setBodyText(editState.initialData.content || editState.initialData.details || "");

                if (currentType === "qna") {
                    setQuestionImageUrlFromInput(editState.initialData.image || "");
                } else {
                    setArticleImageUrlFromInput(editState.initialData.image || "");
                }
                return;
            }

            try {
                const collectionName = getCollectionByPostType(currentType);
                const postRef = doc(db, collectionName, postId);
                const postSnap = await getDoc(postRef);

                if (!postSnap.exists()) {
                    alert(ALERT_MESSAGES.POST_NOT_FOUND);
                    navigate(currentType === "qna" ? APP_ROUTES.QNA : APP_ROUTES.ARTICLES, { replace: true });
                    return;
                }

                const postData = postSnap.data();
                setTitle(postData.title || "");
                setBodyText(currentType === "qna"
                    ? (postData.details || postData.content || "")
                    : (postData.content || postData.description || "")
                );

                if (currentType === "qna") {
                    setQuestionImageUrlFromInput(postData.image || "");
                } else {
                    setArticleImageUrlFromInput(postData.image || "");
                }
            } catch (error) {
                alert(ALERT_MESSAGES.POST_LOAD_FAILED_FOR_EDIT);
            }
        };

        loadPost();
    }, [
        editState,
        hasPostId,
        navigate,
        normalizedRouteType,
        postId,
        setArticleImageUrlFromInput,
        setQuestionImageUrlFromInput
    ]);

    const handleTogglePostType = (_event, nextValue) => {
        if (!nextValue) return;

        if (nextValue === postType) return;

        const currentImageValue = imageUrl || previewSrc || "";

        if (nextValue === "qna") {
            if (!questionImageUrl && currentImageValue) {
                setQuestionImageUrlFromInput(currentImageValue);
            }
        } else {
            if (!articleImageUrl && currentImageValue) {
                setArticleImageUrlFromInput(currentImageValue);
            }
        }

        setPostType(nextValue);
    };

    const handleSubmit = async () => {
        if (!db) {
            alert(ALERT_MESSAGES.FIREBASE_NOT_CONFIGURED);
            return;
        }

        if (!title.trim() || !bodyText.trim()) {
            alert(isQnA ? ALERT_MESSAGES.POST_FIELDS_REQUIRED_QUESTION : ALERT_MESSAGES.POST_FIELDS_REQUIRED_ARTICLE);
            return;
        }

        try {
            setIsSaving(true);
            const currentUser = auth.currentUser;

            if (!currentUser) {
                alert(ALERT_MESSAGES.AUTH_REQUIRED_FOR_POST_EDIT);
                setIsSaving(false);
                navigate(APP_ROUTES.LOGIN);
                return;
            }

            const originalPostType = editState?.postType === "qna" ? "qna" : normalizedRouteType;
            const selectedPostType = isQnA ? "qna" : "article";

            const getPayloadByType = (postTypeValue) => (
                postTypeValue === "qna"
                    ? {
                        title: title.trim(),
                        details: bodyText.trim(),
                        content: bodyText.trim(),
                        image: imageUrl.trim() || "",
                        updatedAt: serverTimestamp()
                    }
                    : {
                        title: title.trim(),
                        description: bodyText.trim(),
                        content: bodyText.trim(),
                        image: imageUrl.trim() || "",
                        updatedAt: serverTimestamp()
                    }
            );

            if (selectedPostType === originalPostType) {
                const postRef = doc(db, getCollectionByPostType(selectedPostType), postId);
                await updateDoc(postRef, getPayloadByType(selectedPostType));
                navigate(selectedPostType === "qna" ? qnaContentRoute(postId) : articleContentRoute(postId));
                return;
            }

            const originalRef = doc(db, getCollectionByPostType(originalPostType), postId);
            const originalSnap = await getDoc(originalRef);

            if (!originalSnap.exists()) {
                throw new Error("Original post not found.");
            }

            const originalData = originalSnap.data();
            const targetRef = doc(db, getCollectionByPostType(selectedPostType), postId);

            const migratedPayload = selectedPostType === "qna"
                ? {
                    uid: originalData.uid ?? currentUser.uid,
                    author: originalData.author ?? currentUser.displayName ?? currentUser.email ?? SHARED_UI_TEXT.UNKNOWN_AUTHOR,
                    handle: originalData.handle ?? (currentUser.email ? `@${currentUser.email.split("@")[0]}` : "@user"),
                    likes: originalData.likes ?? 0,
                    dislikes: originalData.dislikes ?? 0,
                    createdAt: originalData.createdAt ?? serverTimestamp(),
                    title: title.trim(),
                    details: bodyText.trim(),
                    content: bodyText.trim(),
                    image: imageUrl.trim() || "",
                    updatedAt: serverTimestamp()
                }
                : {
                    uid: originalData.uid ?? currentUser.uid,
                    author: originalData.author ?? currentUser.displayName ?? currentUser.email ?? SHARED_UI_TEXT.UNKNOWN_AUTHOR,
                    handle: originalData.handle ?? (currentUser.email ? `@${currentUser.email.split("@")[0]}` : "@user"),
                    likes: originalData.likes ?? 0,
                    dislikes: originalData.dislikes ?? 0,
                    createdAt: originalData.createdAt ?? serverTimestamp(),
                    title: title.trim(),
                    description: bodyText.trim(),
                    content: bodyText.trim(),
                    image: imageUrl.trim() || "",
                    updatedAt: serverTimestamp()
                };

            await setDoc(targetRef, migratedPayload);
            await deleteDoc(originalRef);

            navigate(selectedPostType === "qna" ? qnaContentRoute(postId) : articleContentRoute(postId));
        } catch (error) {
            alert(isQnA ? ALERT_MESSAGES.POST_UPDATE_FAILED_QUESTION : ALERT_MESSAGES.POST_UPDATE_FAILED_ARTICLE);
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
                    {POST_EDITOR_UI_TEXT.EDIT_POST_TITLE}
                </Typography>

                <Box sx={{ width: "100%", maxWidth: "520px", ml: { md: 2 } }}>
                    <TextField
                        fullWidth
                        variant="standard"
                        placeholder={POST_EDITOR_UI_TEXT.TITLE_PLACEHOLDER}
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
                        placeholder={isQnA ? POST_EDITOR_UI_TEXT.DETAILS_PLACEHOLDER : POST_EDITOR_UI_TEXT.CONTENT_PLACEHOLDER}
                        value={bodyText}
                        onChange={(event) => setBodyText(event.target.value)}
                        InputProps={{ disableUnderline: false }}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        variant="standard"
                        placeholder={POST_EDITOR_UI_TEXT.IMAGE_URL_PLACEHOLDER}
                        value={imageInputValue}
                        onChange={(event) => setImageUrlFromInput(event.target.value)}
                        InputProps={{ disableUnderline: false }}
                        sx={{ mt: 2 }}
                    />

                    <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 3 }}>
                        <ToggleButtonGroup
                            value={postType}
                            exclusive
                            onChange={handleTogglePostType}
                            size="small"
                        >
                            <ToggleButton value="article">{POST_EDITOR_UI_TEXT.TYPE_ARTICLE}</ToggleButton>
                            <ToggleButton value="qna">{POST_EDITOR_UI_TEXT.TYPE_QNA}</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

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
                                    alt={isQnA ? POST_EDITOR_UI_TEXT.ALT_QUESTION : POST_EDITOR_UI_TEXT.ALT_ARTICLE}
                                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                <ImageOutlinedIcon sx={{ fontSize: 54, color: "#111" }} />
                            )}
                        </Box>
                        <CircleIconButton
                            icon={hasImage ? <DeleteOutlineIcon /> : <AddIcon />}
                            onClick={hasImage ? handleRemoveImage : handlePickImage}
                            disabled={isSaving}
                            borderColor={hasImage ? "#d32f2f" : "black"}
                            iconColor={hasImage ? "#d32f2f" : "black"}
                            sx={{ ml: 2 }}
                        />
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
                        onClick={handleSubmit}
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
                        {isSaving ? POST_EDITOR_UI_TEXT.SAVE_LOADING : isUploadingImage ? POST_EDITOR_UI_TEXT.IMAGE_UPLOADING : POST_EDITOR_UI_TEXT.UPDATE_ACTION}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default EditPost;
