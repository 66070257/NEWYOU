import React, { useEffect, useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { addDoc, collection, doc, increment, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../database/firebase";

const articleData = {
    1: {
        author: "Argoon",
        handle: "@daydreamer_22",
        date: "Jan 01, 26",
        title: "เริ่มออกกำลังกายวันแรก ไม่ได้ยากอย่างที่คิด",
        content: "ก่อนหน้านี้ฉันคิดว่าการออกกำลังกายต้องจริงจังและเหนื่อยมาก\nแต่วันแรกฉันแค่เดินเร็ว 20 นาที\nแม้จะเหนื่อยนิดหน่อย แต่รู้สึกดีที่ได้เริ่ม\nการเริ่มจากสิ่งเล็ก ๆ ทำให้ฉันไม่กดดันตัวเองและอยากทำต่อในวันถัดไป",
        image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438"
    },
    2: {
        author: "Miss Rachel",
        handle: "@fit_journey",
        date: "Jan 02, 26",
        title: "เริ่มเช้าแบบเบา ๆ แล้วค่อยไปต่อ",
        content: "การเริ่มต้นไม่จำเป็นต้องหนักเสมอไป\nแค่ลุกขึ้นมาขยับร่างกายวันละนิดก็เพียงพอ\nพอทำต่อเนื่อง ความมั่นใจจะค่อย ๆ เพิ่มขึ้น",
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"
    }
};

const ArticleContent = () => {
    const { id } = useParams();
    const [liveArticle, setLiveArticle] = useState(null);
    const [commentInput, setCommentInput] = useState("");
    const [comments, setComments] = useState([]);
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

    const article = liveArticle || articleData[id] || articleData[1];

    const articleDate =
        article.createdAt?.toDate
            ? article.createdAt.toDate().toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "2-digit"
            })
            : article.date;

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

                <Box
                    component="img"
                    src={article.image}
                    alt="article"
                    sx={{
                        width: "100%",
                        borderRadius: "12px",
                        mt: 2,
                        height: { xs: "320px", md: "560px" },
                        objectFit: "cover"
                    }}
                />

                <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end", gap: 1 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handlePostReaction("likes")}
                        sx={{ borderRadius: "999px", textTransform: "none", px: 2 }}
                    >
                        LIKE {article.likes ?? 0}
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handlePostReaction("dislikes")}
                        sx={{ borderRadius: "999px", textTransform: "none", px: 2 }}
                    >
                        DISLIKE {article.dislikes ?? 0}
                    </Button>
                </Box>

                <Typography sx={{ mt: 2, mb: 1.5 }} fontWeight={600}>
                    Comments
                </Typography>

                <Box sx={{ p: 1.5, backgroundColor: "#f5f5f5", borderRadius: 2 }}>
                    <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        variant="standard"
                        placeholder="Write a comment..."
                        value={commentInput}
                        onChange={(event) => setCommentInput(event.target.value)}
                        InputProps={{ disableUnderline: true }}
                    />
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleAddComment}
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
                                    onClick={() => handleCommentReaction(comment.id, "likes")}
                                    sx={{ minWidth: 0, p: 0, textTransform: "none", textDecoration: "underline" }}
                                >
                                    LIKE {comment.likes ?? 0}
                                </Button>
                                <Button
                                    variant="text"
                                    size="small"
                                    onClick={() => handleCommentReaction(comment.id, "dislikes")}
                                    sx={{ minWidth: 0, p: 0, textTransform: "none", textDecoration: "underline" }}
                                >
                                    DISLIKE {comment.dislikes ?? 0}
                                </Button>
                            </Box>
                        </Box>
                    ))
                ) : (
                    <Typography sx={{ mt: 1.5 }} variant="body2" color="text.secondary">
                        ยังไม่มีคอมเมนต์
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default ArticleContent;
