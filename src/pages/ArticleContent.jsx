import React, { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { addDoc, collection, doc, increment, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../database/firebase";
import CommentsSection from "../components/CommentsSection";

const LEGACY_DEFAULT_IMAGE_URL = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438";

const ArticleContent = () => {
    const { id } = useParams();
    const [liveArticle, setLiveArticle] = useState(null);
    const [postReaction, setPostReaction] = useState(null);
    const [commentInput, setCommentInput] = useState("");
    const [comments, setComments] = useState([]);
    const [commentReactions, setCommentReactions] = useState({});
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    useEffect(() => {
        if (!db || !id) return undefined;

        const postRef = doc(db, "articles", id);

        const unsubscribe = onSnapshot(postRef, (docSnap) => {
            if (docSnap.exists()) {
                setLiveArticle({ id: docSnap.id, ...docSnap.data() });
            }
        });

        return () => unsubscribe();
    }, [id]);

    useEffect(() => {
        if (!db || !id) {
            setComments([]);
            return undefined;
        }

        const commentsRef = collection(db, "articles", id, "comments");
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

        const reactionRef = doc(db, "articles", id, "reactions", currentUser.uid);

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
            const reactionRef = doc(db, "articles", id, "comments", comment.id, "reactions", currentUser.uid);

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
            alert("กรุณาเข้าสู่ระบบก่อนคอมเมนต์");
            return;
        }

        try {
            setIsSubmittingComment(true);

            await addDoc(collection(db, "articles", id, "comments"), {
                uid: currentUser.uid,
                author: currentUser.displayName || currentUser.email || "Unknown",
                text: commentInput.trim(),
                likes: 0,
                dislikes: 0,
                createdAt: serverTimestamp()
            });

            setCommentInput("");
        } catch (error) {
            alert("เพิ่มคอมเมนต์ไม่สำเร็จ");
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleCommentReaction = async (commentId, field) => {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            alert("กรุณาเข้าสู่ระบบก่อนกดโหวต");
            return;
        }

        try {
            const commentRef = doc(db, "articles", id, "comments", commentId);
            const reactionRef = doc(db, "articles", id, "comments", commentId, "reactions", currentUser.uid);

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
            alert("อัปเดตคะแนนไม่สำเร็จ");
        }
    };

    const handlePostReaction = async (field) => {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            alert("กรุณาเข้าสู่ระบบก่อนกดโหวต");
            return;
        }

        try {
            const postRef = doc(db, "articles", id);
            const reactionRef = doc(db, "articles", id, "reactions", currentUser.uid);

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
            alert("อัปเดตคะแนนโพสต์ไม่สำเร็จ");
        }
    };

    const article = liveArticle;

    if (!article) {
        return (
            <Box sx={{ backgroundColor: "#efefef", minHeight: "100vh", pt: 12, pb: 7 }}>
                <Box sx={{ width: "90%", maxWidth: "880px", mx: "auto" }}>
                    <Typography color="text.secondary">ไม่พบบทความนี้</Typography>
                </Box>
            </Box>
        );
    }

    const articleDate =
        article.createdAt?.toDate
            ? article.createdAt.toDate().toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "2-digit"
            })
            : "-";

    const displayImage = article.image === LEGACY_DEFAULT_IMAGE_URL ? "" : article.image;

    return (
        <Box sx={{ backgroundColor: "#efefef", minHeight: "100vh", pt: 12, pb: 7 }}>
            <Box sx={{ width: "90%", maxWidth: "880px", mx: "auto" }}>
                <Typography fontWeight={700}>{article.author}</Typography>
                <Typography variant="caption" color="text.secondary">
                    {article.handle}
                </Typography>
                <Typography sx={{ mt: 2, mb: 1 }}>{articleDate}</Typography>

                <Typography sx={{ fontSize: { xs: "34px", md: "48px" }, fontWeight: 500, lineHeight: 1.1 }}>
                    {article.title}
                </Typography>

                <Typography sx={{ mt: 2, whiteSpace: "pre-line", maxWidth: "760px" }}>
                    {article.content || article.description}
                </Typography>

                {displayImage ? (
                    <Box
                        component="img"
                        src={displayImage}
                        alt="article"
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
                    <Button
                        variant={postReaction === "likes" ? "contained" : "outlined"}
                        size="small"
                        onClick={() => handlePostReaction("likes")}
                        sx={{ borderRadius: "999px", textTransform: "none", px: 2 }}
                    >
                        LIKE {article.likes ?? 0}
                    </Button>
                    <Button
                        variant={postReaction === "dislikes" ? "contained" : "outlined"}
                        size="small"
                        onClick={() => handlePostReaction("dislikes")}
                        color={postReaction === "dislikes" ? "error" : "primary"}
                        sx={{ borderRadius: "999px", textTransform: "none", px: 2 }}
                    >
                        DISLIKE {article.dislikes ?? 0}
                    </Button>
                </Box>

                <CommentsSection
                    commentInput={commentInput}
                    onCommentInputChange={setCommentInput}
                    onAddComment={handleAddComment}
                    isSubmittingComment={isSubmittingComment}
                    comments={comments}
                    commentReactions={commentReactions}
                    onCommentReaction={handleCommentReaction}
                />
            </Box>
        </Box>
    );
};

export default ArticleContent;
