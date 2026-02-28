import React, { useEffect, useState } from "react";
import { Box, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { useNavigate, useParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, increment, onSnapshot, orderBy, query, runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../database/firebase";
import CommentsSection from "../components/CommentsSection";
import VoteButton from "../components/VoteButton";
import { IMAGE_FALLBACK_SRC } from "../constants/imageFallback";

const LEGACY_DEFAULT_IMAGE_URL = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438";

const QuestionContent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [liveQuestion, setLiveQuestion] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [postReaction, setPostReaction] = useState(null);
    const [commentInput, setCommentInput] = useState("");
    const [comments, setComments] = useState([]);
    const [commentReactions, setCommentReactions] = useState({});
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isUpdatingCommentId, setIsUpdatingCommentId] = useState(null);
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!db || !id) return undefined;

        const postRef = doc(db, "questions", id);

        const unsubscribe = onSnapshot(postRef, (docSnap) => {
            if (docSnap.exists()) {
                setLiveQuestion({ id: docSnap.id, ...docSnap.data() });
            }
        });

        return () => unsubscribe();
    }, [id]);

    useEffect(() => {
        if (!db || !id) {
            setComments([]);
            return undefined;
        }

        const commentsRef = collection(db, "questions", id, "comments");
        const commentsQuery = query(commentsRef, orderBy("createdAt", "asc"));

        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
            const items = snapshot.docs.map((docItem) => ({
                id: docItem.id,
                ...docItem.data()
            }));

            setComments(items);
        });

        return () => unsubscribe();
    }, [id]);

    useEffect(() => {
        const currentUser = auth.currentUser;

        if (!db || !id || !currentUser) {
            setPostReaction(null);
            return undefined;
        }

        const reactionRef = doc(db, "questions", id, "reactions", currentUser.uid);

        const unsubscribe = onSnapshot(reactionRef, (reactionSnap) => {
            setPostReaction(reactionSnap.exists() ? reactionSnap.data()?.type : null);
        });

        return () => unsubscribe();
    }, [id]);

    useEffect(() => {
        const currentUser = auth.currentUser;

        if (!db || !id || !currentUser || comments.length === 0) {
            setCommentReactions({});
            return undefined;
        }

        const unsubscribers = comments.map((comment) => {
            const reactionRef = doc(db, "questions", id, "comments", comment.id, "reactions", currentUser.uid);

            return onSnapshot(reactionRef, (reactionSnap) => {
                setCommentReactions((previous) => ({
                    ...previous,
                    [comment.id]: reactionSnap.exists() ? reactionSnap.data()?.type : null
                }));
            });
        });

        return () => {
            unsubscribers.forEach((unsubscribe) => unsubscribe());
        };
    }, [id, comments]);

    const handleAddComment = async () => {
        if (!commentInput.trim()) {
            return;
        }

        const currentUser = auth.currentUser;

        if (!currentUser) {
            alert("Please log in before commenting.");
            return;
        }

        try {
            setIsSubmittingComment(true);

            await addDoc(collection(db, "questions", id, "comments"), {
                uid: currentUser.uid,
                author: currentUser.displayName || currentUser.email || "Unknown",
                text: commentInput.trim(),
                likes: 0,
                dislikes: 0,
                createdAt: serverTimestamp()
            });

            setCommentInput("");
        } catch (error) {
            alert("Failed to add comment.");
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleCommentReaction = async (commentId, field) => {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            alert("Please log in before voting.");
            return;
        }

        try {
            const commentRef = doc(db, "questions", id, "comments", commentId);
            const reactionRef = doc(db, "questions", id, "comments", commentId, "reactions", currentUser.uid);

            await runTransaction(db, async (transaction) => {
                const reactionSnap = await transaction.get(reactionRef);

                if (!reactionSnap.exists()) {
                    transaction.update(commentRef, {
                        [field]: increment(1)
                    });

                    transaction.set(reactionRef, {
                        uid: currentUser.uid,
                        type: field,
                        createdAt: serverTimestamp()
                    });
                    return;
                }

                const previousType = reactionSnap.data()?.type;

                if (previousType === field) {
                    transaction.update(commentRef, {
                        [field]: increment(-1)
                    });
                    transaction.delete(reactionRef);
                    return;
                }

                transaction.update(commentRef, {
                    [previousType]: increment(-1),
                    [field]: increment(1)
                });

                transaction.update(reactionRef, {
                    type: field,
                    updatedAt: serverTimestamp()
                });
            });
        } catch (error) {
            alert("Failed to update reaction.");
        }
    };

    const handleUpdateComment = async (commentId, nextText) => {
        const trimmedText = nextText.trim();

        if (!trimmedText) {
            alert("Comment cannot be empty.");
            return false;
        }

        const currentUser = auth.currentUser;

        if (!currentUser) {
            alert("Please log in before editing comments.");
            return false;
        }

        const targetComment = comments.find((comment) => comment.id === commentId);

        if (!targetComment || targetComment.uid !== currentUser.uid) {
            alert("You can only edit your own comments.");
            return false;
        }

        try {
            setIsUpdatingCommentId(commentId);
            const commentRef = doc(db, "questions", id, "comments", commentId);

            await updateDoc(commentRef, {
                text: trimmedText,
                updatedAt: serverTimestamp()
            });

            return true;
        } catch (error) {
            alert("Failed to update comment.");
            return false;
        } finally {
            setIsUpdatingCommentId(null);
        }
    };

    const handlePostReaction = async (field) => {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            alert("Please log in before voting.");
            return;
        }

        try {
            const postRef = doc(db, "questions", id);
            const reactionRef = doc(db, "questions", id, "reactions", currentUser.uid);

            await runTransaction(db, async (transaction) => {
                const reactionSnap = await transaction.get(reactionRef);

                if (!reactionSnap.exists()) {
                    transaction.update(postRef, {
                        [field]: increment(1)
                    });

                    transaction.set(reactionRef, {
                        uid: currentUser.uid,
                        type: field,
                        createdAt: serverTimestamp()
                    });
                    return;
                }

                const previousType = reactionSnap.data()?.type;

                if (previousType === field) {
                    transaction.update(postRef, {
                        [field]: increment(-1)
                    });
                    transaction.delete(reactionRef);
                    return;
                }

                transaction.update(postRef, {
                    [previousType]: increment(-1),
                    [field]: increment(1)
                });

                transaction.update(reactionRef, {
                    type: field,
                    updatedAt: serverTimestamp()
                });
            });
        } catch (error) {
            alert("Failed to update post reaction.");
        }
    };

    const question = liveQuestion;

    if (!question) {
        return (
            <Box sx={{ backgroundColor: "#efefef", minHeight: "100vh", pt: 12, pb: 7 }}>
                <Box sx={{ width: "90%", maxWidth: "880px", mx: "auto" }}>
                    <Typography color="text.secondary">Question not found</Typography>
                </Box>
            </Box>
        );
    }

    const questionDate =
        question.createdAt?.toDate
            ? question.createdAt.toDate().toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "2-digit"
            })
            : "-";

    const displayImage = question.image === LEGACY_DEFAULT_IMAGE_URL ? "" : question.image;
    const isOwner = Boolean(currentUser?.uid && question.uid === currentUser.uid);

    const handleOpenMenu = (event) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setMenuAnchorEl(null);
    };

    const handleEditPost = () => {
        handleCloseMenu();
        navigate(`/edit-post/qna/${id}`, {
            state: {
                mode: "edit",
                postType: "qna",
                postId: id,
                initialData: {
                    title: question.title || "",
                    details: question.details || question.content || "",
                    image: question.image || ""
                }
            }
        });
    };

    const handleDeletePost = async () => {
        handleCloseMenu();

        if (!window.confirm("Delete this question?")) {
            return;
        }

        try {
            await deleteDoc(doc(db, "questions", id));
            navigate("/qna");
        } catch (error) {
            alert("Failed to delete question.");
        }
    };

    return (
        <Box sx={{ backgroundColor: "#efefef", minHeight: "100vh", pt: 12, pb: 7 }}>
            <Box sx={{ width: "90%", maxWidth: "880px", mx: "auto" }}>
                <Typography
                    variant="overline"
                    sx={{ color: "text.secondary", letterSpacing: 1.2, fontWeight: 700 }}
                >
                    QUESTION
                </Typography>
                <Typography fontWeight={700}>{question.author}</Typography>
                <Typography variant="caption" color="text.secondary">
                    {question.handle}
                </Typography>
                <Menu
                    anchorEl={menuAnchorEl}
                    open={Boolean(menuAnchorEl)}
                    onClose={handleCloseMenu}
                >
                    <MenuItem onClick={handleEditPost}>Edit</MenuItem>
                    <MenuItem onClick={handleDeletePost}>Delete</MenuItem>
                </Menu>
                <Typography sx={{ mt: 2, mb: 1 }}>{questionDate}</Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ fontSize: { xs: "34px", md: "48px" }, fontWeight: 500, lineHeight: 1.1 }}>
                        {question.title}
                    </Typography>
                    {isOwner ? (
                        <IconButton size="small" onClick={handleOpenMenu}>
                            <MoreHorizIcon fontSize="small" />
                        </IconButton>
                    ) : null}
                </Box>

                <Typography sx={{ mt: 2, whiteSpace: "pre-line", maxWidth: "760px" }}>
                    {question.content || question.details}
                </Typography>

                {displayImage ? (
                    <Box
                        component="img"
                        src={displayImage}
                        alt="question"
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
                        count={question.likes ?? 0}
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
                        count={question.dislikes ?? 0}
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

export default QuestionContent;
