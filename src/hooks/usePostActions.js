import { useState } from "react";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../database/firebase";
import { FIRESTORE_COLLECTIONS } from "../constants/collections";
import { SHARED_UI_TEXT } from "../constants/uiText";
import { applyReactionTransaction } from "../utils/reactions";

export const POST_ACTION_ERROR_CODES = {
    AUTH_REQUIRED_FOR_COMMENT: "AUTH_REQUIRED_FOR_COMMENT",
    AUTH_REQUIRED_FOR_VOTE: "AUTH_REQUIRED_FOR_VOTE",
    AUTH_REQUIRED_FOR_COMMENT_EDIT: "AUTH_REQUIRED_FOR_COMMENT_EDIT",
    COMMENT_EMPTY: "COMMENT_EMPTY",
    COMMENT_EDIT_NOT_OWNER: "COMMENT_EDIT_NOT_OWNER",
    COMMENT_ADD_FAILED: "COMMENT_ADD_FAILED",
    COMMENT_UPDATE_FAILED: "COMMENT_UPDATE_FAILED",
    REACTION_UPDATE_FAILED: "REACTION_UPDATE_FAILED",
    POST_REACTION_UPDATE_FAILED: "POST_REACTION_UPDATE_FAILED"
};

const usePostActions = ({ collectionName, postId, comments }) => {
    const [commentInput, setCommentInput] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isUpdatingCommentId, setIsUpdatingCommentId] = useState(null);

    const handleAddComment = async () => {
        if (!commentInput.trim()) {
            return { ok: false, errorCode: null };
        }

        const activeUser = auth.currentUser;

        if (!activeUser) {
            return { ok: false, errorCode: POST_ACTION_ERROR_CODES.AUTH_REQUIRED_FOR_COMMENT };
        }

        try {
            setIsSubmittingComment(true);

            await addDoc(collection(db, collectionName, postId, FIRESTORE_COLLECTIONS.COMMENTS), {
                uid: activeUser.uid,
                author: activeUser.displayName || activeUser.email || SHARED_UI_TEXT.UNKNOWN_AUTHOR,
                text: commentInput.trim(),
                likes: 0,
                dislikes: 0,
                createdAt: serverTimestamp()
            });

            setCommentInput("");
            return { ok: true, errorCode: null };
        } catch (error) {
            return { ok: false, errorCode: POST_ACTION_ERROR_CODES.COMMENT_ADD_FAILED };
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleCommentReaction = async (commentId, field) => {
        const activeUser = auth.currentUser;

        if (!activeUser) {
            return { ok: false, errorCode: POST_ACTION_ERROR_CODES.AUTH_REQUIRED_FOR_VOTE };
        }

        try {
            await applyReactionTransaction({
                db,
                itemRef: doc(db, collectionName, postId, FIRESTORE_COLLECTIONS.COMMENTS, commentId),
                reactionRef: doc(
                    db,
                    collectionName,
                    postId,
                    FIRESTORE_COLLECTIONS.COMMENTS,
                    commentId,
                    FIRESTORE_COLLECTIONS.REACTIONS,
                    activeUser.uid
                ),
                field,
                uid: activeUser.uid
            });
            return { ok: true, errorCode: null };
        } catch (error) {
            return { ok: false, errorCode: POST_ACTION_ERROR_CODES.REACTION_UPDATE_FAILED };
        }
    };

    const handleUpdateComment = async (commentId, nextText) => {
        const trimmedText = nextText.trim();

        if (!trimmedText) {
            return { ok: false, errorCode: POST_ACTION_ERROR_CODES.COMMENT_EMPTY };
        }

        const activeUser = auth.currentUser;

        if (!activeUser) {
            return { ok: false, errorCode: POST_ACTION_ERROR_CODES.AUTH_REQUIRED_FOR_COMMENT_EDIT };
        }

        const targetComment = comments.find((comment) => comment.id === commentId);

        if (!targetComment || targetComment.uid !== activeUser.uid) {
            return { ok: false, errorCode: POST_ACTION_ERROR_CODES.COMMENT_EDIT_NOT_OWNER };
        }

        try {
            setIsUpdatingCommentId(commentId);
            const commentRef = doc(db, collectionName, postId, FIRESTORE_COLLECTIONS.COMMENTS, commentId);

            await updateDoc(commentRef, {
                text: trimmedText,
                updatedAt: serverTimestamp()
            });

            return { ok: true, errorCode: null };
        } catch (error) {
            return { ok: false, errorCode: POST_ACTION_ERROR_CODES.COMMENT_UPDATE_FAILED };
        } finally {
            setIsUpdatingCommentId(null);
        }
    };

    const handlePostReaction = async (field) => {
        const activeUser = auth.currentUser;

        if (!activeUser) {
            return { ok: false, errorCode: POST_ACTION_ERROR_CODES.AUTH_REQUIRED_FOR_VOTE };
        }

        try {
            await applyReactionTransaction({
                db,
                itemRef: doc(db, collectionName, postId),
                reactionRef: doc(db, collectionName, postId, FIRESTORE_COLLECTIONS.REACTIONS, activeUser.uid),
                field,
                uid: activeUser.uid
            });
            return { ok: true, errorCode: null };
        } catch (error) {
            return { ok: false, errorCode: POST_ACTION_ERROR_CODES.POST_REACTION_UPDATE_FAILED };
        }
    };

    return {
        commentInput,
        setCommentInput,
        isSubmittingComment,
        isUpdatingCommentId,
        handleAddComment,
        handleCommentReaction,
        handleUpdateComment,
        handlePostReaction
    };
};

export default usePostActions;
