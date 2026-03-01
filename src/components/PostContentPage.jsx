import React, { useState } from "react";
import { Box, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { useNavigate, useParams } from "react-router-dom";
import {
    deleteDoc,
    doc
} from "firebase/firestore";
import { db } from "../database/firebase";
import { editPostRoute } from "../constants/routes";
import { ALERT_MESSAGES } from "../constants/messages";
import CommentsSection from "./CommentsSection";
import VoteButton from "./VoteButton";
import { formatDate } from "../utils/date";
import { IMAGE_FALLBACK_SRC } from "../constants/imageFallback";
import { POST_CONTENT_UI_TEXT } from "../constants/uiText";
import usePostContentData from "../hooks/usePostContentData";

const PostContentPage = ({
    collectionName,
    label,
    notFoundText,
    imageAlt,
    editPostType,
    deleteConfirmText,
    deleteFailText,
    navigateAfterDelete,
    getBodyText,
    getEditInitialData
}) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const {
        post,
        isPostResolved,
        currentUser,
        postReaction,
        commentInput,
        setCommentInput,
        comments,
        commentReactions,
        isSubmittingComment,
        isUpdatingCommentId,
        handleAddCommentAction,
        handleCommentReactionAction,
        handleUpdateCommentAction,
        handlePostReactionAction
    } = usePostContentData({ collectionName, postId: id });

    const showActionError = (errorCode) => {
        if (!errorCode) {
            return;
        }

        const message = ALERT_MESSAGES[errorCode];

        if (message) {
            alert(message);
        }
    };

    const handleAddComment = async () => {
        const result = await handleAddCommentAction();
        showActionError(result?.errorCode);
    };

    const handleCommentReaction = async (commentId, field) => {
        const result = await handleCommentReactionAction(commentId, field);
        showActionError(result?.errorCode);
    };

    const handleUpdateComment = async (commentId, nextText) => {
        const result = await handleUpdateCommentAction(commentId, nextText);
        showActionError(result?.errorCode);
        return Boolean(result?.ok);
    };

    const handlePostReaction = async (field) => {
        const result = await handlePostReactionAction(field);
        showActionError(result?.errorCode);
    };

    const handleOpenMenu = (event) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setMenuAnchorEl(null);
    };

    const handleEditPost = () => {
        if (!post) {
            return;
        }

        handleCloseMenu();
        navigate(editPostRoute(editPostType, id), {
            state: {
                mode: "edit",
                postType: editPostType,
                postId: id,
                initialData: getEditInitialData(post)
            }
        });
    };

    const handleDeletePost = async () => {
        handleCloseMenu();

        if (!window.confirm(deleteConfirmText)) {
            return;
        }

        try {
            await deleteDoc(doc(db, collectionName, id));
            navigate(navigateAfterDelete);
        } catch (error) {
            alert(deleteFailText);
        }
    };

    if (!isPostResolved) {
        return (
            <Box sx={{ backgroundColor: "#efefef", minHeight: "100vh", pt: 12, pb: 7 }}>
                <Box sx={{ width: "90%", maxWidth: "880px", mx: "auto" }}>
                    <Typography color="text.secondary">{POST_CONTENT_UI_TEXT.LOADING}</Typography>
                </Box>
            </Box>
        );
    }

    if (!post) {
        return (
            <Box sx={{ backgroundColor: "#efefef", minHeight: "100vh", pt: 12, pb: 7 }}>
                <Box sx={{ width: "90%", maxWidth: "880px", mx: "auto" }}>
                    <Typography color="text.secondary">{notFoundText}</Typography>
                </Box>
            </Box>
        );
    }

    const postDate = formatDate(post.createdAt);
    const displayImage = post.image || "";
    const isOwner = Boolean(currentUser?.uid && post.uid === currentUser.uid);

    return (
        <Box sx={{ backgroundColor: "#efefef", minHeight: "100vh", pt: 12, pb: 7 }}>
            <Box sx={{ width: "90%", maxWidth: "880px", mx: "auto" }}>
                <Typography
                    variant="overline"
                    sx={{ color: "text.secondary", letterSpacing: 1.2, fontWeight: 700 }}
                >
                    {label}
                </Typography>
                <Typography fontWeight={700}>{post.author}</Typography>
                <Typography variant="caption" color="text.secondary">
                    {post.handle}
                </Typography>
                <Menu
                    anchorEl={menuAnchorEl}
                    open={Boolean(menuAnchorEl)}
                    onClose={handleCloseMenu}
                >
                    <MenuItem onClick={handleEditPost}>{POST_CONTENT_UI_TEXT.EDIT_MENU}</MenuItem>
                    <MenuItem onClick={handleDeletePost}>{POST_CONTENT_UI_TEXT.DELETE_MENU}</MenuItem>
                </Menu>
                <Typography sx={{ mt: 2, mb: 1 }}>{postDate}</Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ fontSize: { xs: "34px", md: "48px" }, fontWeight: 500, lineHeight: 1.1 }}>
                        {post.title}
                    </Typography>
                    {isOwner ? (
                        <IconButton size="small" onClick={handleOpenMenu}>
                            <MoreHorizIcon fontSize="small" />
                        </IconButton>
                    ) : null}
                </Box>

                <Typography sx={{ mt: 2, whiteSpace: "pre-line", maxWidth: "760px" }}>
                    {getBodyText(post)}
                </Typography>

                {displayImage ? (
                    <Box
                        component="img"
                        src={displayImage}
                        alt={imageAlt}
                        onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = IMAGE_FALLBACK_SRC;
                        }}
                        sx={{
                            width: "100%",
                            borderRadius: "12px",
                            mt: 2,
                            height: { xs: "320px", md: "560px" },
                            objectFit: "cover"
                        }}
                    />
                ) : null}

                <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end", gap: 1 }}>
                    <VoteButton
                        type="likes"
                        active={postReaction === "likes"}
                        count={post.likes ?? 0}
                        outlinedWhenInactive
                        inactiveOutlineColor="#333333"
                        onClick={() => handlePostReaction("likes")}
                        sx={{
                            borderRadius: "999px",
                            px: 2
                        }}
                    />
                    <VoteButton
                        type="dislikes"
                        active={postReaction === "dislikes"}
                        count={post.dislikes ?? 0}
                        outlinedWhenInactive
                        inactiveOutlineColor="#333333"
                        onClick={() => handlePostReaction("dislikes")}
                        sx={{
                            borderRadius: "999px",
                            px: 2
                        }}
                    />
                </Box>

                <CommentsSection
                    commentInput={commentInput}
                    onCommentInputChange={setCommentInput}
                    onAddComment={handleAddComment}
                    isSubmittingComment={isSubmittingComment}
                    comments={comments}
                    commentReactions={commentReactions}
                    onCommentReaction={handleCommentReaction}
                    currentUserUid={currentUser?.uid || ""}
                    onUpdateComment={handleUpdateComment}
                    isUpdatingCommentId={isUpdatingCommentId}
                />
            </Box>
        </Box>
    );
};

export default PostContentPage;
