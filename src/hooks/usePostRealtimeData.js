import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { auth, db } from "../database/firebase";
import { FIRESTORE_COLLECTIONS } from "../constants/collections";
import { mapSnapshotDocs } from "../utils/firestore";

const usePostRealtimeData = ({ collectionName, postId }) => {
    const [post, setPost] = useState(null);
    const [isPostResolved, setIsPostResolved] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [comments, setComments] = useState([]);
    const [postReaction, setPostReaction] = useState(null);
    const [commentReactions, setCommentReactions] = useState({});

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!db || !postId) {
            setPost(null);
            setIsPostResolved(true);
            return undefined;
        }

        setIsPostResolved(false);

        const postRef = doc(db, collectionName, postId);

        const unsubscribe = onSnapshot(postRef, (docSnap) => {
            if (docSnap.exists()) {
                setPost({ id: docSnap.id, ...docSnap.data() });
                setIsPostResolved(true);
                return;
            }

            setPost(null);
            setIsPostResolved(true);
        });

        return () => unsubscribe();
    }, [collectionName, postId]);

    useEffect(() => {
        if (!db || !postId) {
            setComments([]);
            return undefined;
        }

        const commentsRef = collection(db, collectionName, postId, FIRESTORE_COLLECTIONS.COMMENTS);
        const commentsQuery = query(commentsRef, orderBy("createdAt", "asc"));

        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
            setComments(mapSnapshotDocs(snapshot));
        });

        return () => unsubscribe();
    }, [collectionName, postId]);

    useEffect(() => {
        const activeUser = currentUser;

        if (!db || !postId || !activeUser) {
            setPostReaction(null);
            return undefined;
        }

        const reactionRef = doc(db, collectionName, postId, FIRESTORE_COLLECTIONS.REACTIONS, activeUser.uid);

        const unsubscribe = onSnapshot(reactionRef, (reactionSnap) => {
            setPostReaction(reactionSnap.exists() ? reactionSnap.data()?.type : null);
        });

        return () => unsubscribe();
    }, [collectionName, currentUser, postId]);

    useEffect(() => {
        const activeUser = currentUser;

        if (!db || !postId || !activeUser || comments.length === 0) {
            setCommentReactions({});
            return undefined;
        }

        const unsubscribers = comments.map((comment) => {
            const reactionRef = doc(
                db,
                collectionName,
                postId,
                FIRESTORE_COLLECTIONS.COMMENTS,
                comment.id,
                FIRESTORE_COLLECTIONS.REACTIONS,
                activeUser.uid
            );

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
    }, [collectionName, comments, currentUser, postId]);

    return {
        post,
        isPostResolved,
        currentUser,
        comments,
        postReaction,
        commentReactions
    };
};

export default usePostRealtimeData;
