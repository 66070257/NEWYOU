import React from "react";
import { Box, Button, TextField, Typography } from "@mui/material";

const CommentsSection = ({
    title = "Comments",
    commentInput,
    onCommentInputChange,
    onAddComment,
    isSubmittingComment,
    comments,
    commentReactions,
    onCommentReaction,
    emptyText = "ยังไม่มีคอมเมนต์"
}) => {
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
                        sx={{ borderRadius: "999px", textTransform: "none" }}
                    >
                        {isSubmittingComment ? "Posting..." : "Comment"}
                    </Button>
                </Box>
            </Box>

            {comments.length > 0 ? (
                comments.map((comment) => (
                    <Box key={comment.id} sx={{ mt: 1.5, p: 1.5, backgroundColor: "#f5f5f5", borderRadius: 2 }}>
                        <Typography variant="body2" fontWeight={600}>
                            {comment.author || "Unknown"}{" "}
                            <Typography component="span" variant="caption" color="text.secondary">
                                {comment.text}
                            </Typography>
                        </Typography>
                        <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
                            <Button
                                variant="text"
                                size="small"
                                onClick={() => onCommentReaction(comment.id, "likes")}
                                sx={{
                                    minWidth: 0,
                                    p: 0,
                                    textTransform: "none",
                                    textDecoration: "underline",
                                    color: commentReactions[comment.id] === "likes" ? "#1976d2" : "inherit",
                                    fontWeight: commentReactions[comment.id] === "likes" ? 700 : 400
                                }}
                            >
                                LIKE {comment.likes ?? 0}
                            </Button>
                            <Button
                                variant="text"
                                size="small"
                                onClick={() => onCommentReaction(comment.id, "dislikes")}
                                sx={{
                                    minWidth: 0,
                                    p: 0,
                                    textTransform: "none",
                                    textDecoration: "underline",
                                    color: commentReactions[comment.id] === "dislikes" ? "#d32f2f" : "inherit",
                                    fontWeight: commentReactions[comment.id] === "dislikes" ? 700 : 400
                                }}
                            >
                                DISLIKE {comment.dislikes ?? 0}
                            </Button>
                        </Box>
                    </Box>
                ))
            ) : (
                <Typography sx={{ mt: 1.5 }} variant="body2" color="text.secondary">
                    {emptyText}
                </Typography>
            )}
        </>
    );
};

export default CommentsSection;
