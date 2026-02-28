import React, { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import VoteButton from "./VoteButton";

const COMMENT_BOX_STYLE = { mt: 1.5, p: 1.5, backgroundColor: "#f5f5f5", borderRadius: 2 };
const COMMENT_ACTION_BUTTON_STYLE = { textTransform: "none", minWidth: 0, px: 0.5, color: "#777777" };

const renderCommentActionButtons = ({
    isCommentOwner,
    isEditing,
    isUpdatingThisComment,
    onStartEdit,
    onCancelEdit,
    onSaveEdit
}) => {
    if (!isCommentOwner) {
        return null;
    }

    if (isEditing) {
        return (
            <>
                <Button
                    variant="text"
                    size="small"
                    onClick={onCancelEdit}
                    disabled={isUpdatingThisComment}
                    sx={COMMENT_ACTION_BUTTON_STYLE}
                >
                    Cancel
                </Button>
                <Button
                    variant="text"
                    size="small"
                    onClick={onSaveEdit}
                    disabled={isUpdatingThisComment}
                    sx={{ ...COMMENT_ACTION_BUTTON_STYLE, fontWeight: 700 }}
                >
                    {isUpdatingThisComment ? "Saving..." : "Save"}
                </Button>
            </>
        );
    }

    return (
        <Button
            variant="text"
            size="small"
            onClick={onStartEdit}
            sx={COMMENT_ACTION_BUTTON_STYLE}
        >
            Edit
        </Button>
    );
};

const CommentsSection = ({
    title = "Comments",
    commentInput,
    onCommentInputChange,
    onAddComment,
    isSubmittingComment,
    comments,
    commentReactions,
    onCommentReaction,
    currentUserUid,
    onUpdateComment,
    isUpdatingCommentId,
    emptyText = "No comments yet"
}) => {
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingText, setEditingText] = useState("");

    const handleStartEdit = (comment) => {
        setEditingCommentId(comment.id);
        setEditingText(comment.text || "");
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditingText("");
    };

    const handleSaveEdit = async () => {
        if (!editingCommentId || !onUpdateComment) {
            return;
        }

        const isUpdated = await onUpdateComment(editingCommentId, editingText);

        if (isUpdated) {
            setEditingCommentId(null);
            setEditingText("");
        }
    };

    return (
        <>
            <Typography sx={{ mt: 2, mb: 1.5 }} fontWeight={600}>
                {title}
            </Typography>

            <Box sx={{ p: 1.5, backgroundColor: "#f5f5f5", borderRadius: 2 }}>
                <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    variant="standard"
                    placeholder="Write a comment..."
                    value={commentInput}
                    onChange={(event) => onCommentInputChange(event.target.value)}
                    InputProps={{ disableUnderline: true }}
                />
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={onAddComment}
                        disabled={isSubmittingComment}
                        sx={{
                            borderRadius: "999px",
                            textTransform: "none",
                            borderColor: "#333333",
                            color: "#333333",
                            fontWeight: 600,
                            "&:hover": {
                                borderColor: "#333333",
                                backgroundColor: "#DCDCDC"
                            }
                        }}
                    >
                        {isSubmittingComment ? "Posting..." : "Comment"}
                    </Button>
                </Box>
            </Box>

            {comments.length > 0 ? (
                comments.map((comment) => {
                    const isCommentOwner = Boolean(currentUserUid && comment.uid === currentUserUid);
                    const isEditing = editingCommentId === comment.id;
                    const isUpdatingThisComment = isUpdatingCommentId === comment.id;

                    return (
                        <Box key={comment.id} sx={COMMENT_BOX_STYLE}>
                            <Typography variant="body2" fontWeight={600}>
                                {comment.author || "Unknown"}:
                            </Typography>

                            {isEditing ? (
                                <TextField
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    variant="standard"
                                    value={editingText}
                                    onChange={(event) => setEditingText(event.target.value)}
                                    InputProps={{ disableUnderline: true }}
                                    sx={{ mt: 0.5 }}
                                />
                            ) : (
                                <Typography component="p" variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {comment.text}
                                </Typography>
                            )}

                            <Box sx={{ mt: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    {renderCommentActionButtons({
                                        isCommentOwner,
                                        isEditing,
                                        isUpdatingThisComment,
                                        onStartEdit: () => handleStartEdit(comment),
                                        onCancelEdit: handleCancelEdit,
                                        onSaveEdit: handleSaveEdit
                                    })}
                                </Box>

                                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
                                    <VoteButton
                                        type="likes"
                                        active={commentReactions[comment.id] === "likes"}
                                        count={comment.likes ?? 0}
                                        onClick={() => onCommentReaction(comment.id, "likes")}
                                    />
                                    <VoteButton
                                        type="dislikes"
                                        active={commentReactions[comment.id] === "dislikes"}
                                        count={comment.dislikes ?? 0}
                                        onClick={() => onCommentReaction(comment.id, "dislikes")}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    );
                })
            ) : (
                <Typography sx={{ mt: 1.5 }} variant="body2" color="text.secondary">
                    {emptyText}
                </Typography>
            )}
        </>
    );
};

export default CommentsSection;
