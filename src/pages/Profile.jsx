import React, { useEffect, useMemo, useState } from "react";
import { Box, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { EmailAuthProvider, deleteUser, onAuthStateChanged, reauthenticateWithCredential, updateProfile } from "firebase/auth";
import { collection, deleteDoc, doc, getDocs, increment, onSnapshot, query, runTransaction, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import ArticleCard from "../components/ArticleCard";
import QnACard from "../components/QnACard";
import SortDropdown from "../components/SortDropdown";
import { auth, db } from "../database/firebase";

const PROFILE_POST_TYPE_OPTIONS = [
    { value: "Articles", label: "Articles" },
    { value: "Q&A", label: "Q&A" }
];

const COLLECTION_NAMES = {
    articles: "articles",
    questions: "questions",
    users: "users"
};

const mapSnapshotDocs = (snapshot) => snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data()
}));

const subscribeOwnedItems = ({ uid, collectionName, onItems, onEmpty }) => {
    if (!uid) {
        onEmpty();
        return undefined;
    }

    const itemsQuery = query(collection(db, collectionName), where("uid", "==", uid));

    return onSnapshot(itemsQuery, (snapshot) => {
        onItems(mapSnapshotDocs(snapshot));
    });
};

const subscribeReactionMap = ({ uid, collectionName, items, setReactions }) => {
    if (!db || !uid || items.length === 0) {
        setReactions({});
        return undefined;
    }

    const unsubscribers = items.map((item) => {
        const reactionRef = doc(db, collectionName, item.id, "reactions", uid);

        return onSnapshot(reactionRef, (reactionSnap) => {
            setReactions((previous) => ({
                ...previous,
                [item.id]: reactionSnap.exists() ? reactionSnap.data()?.type : null
            }));
        });
    });

    return () => {
        unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
};

const formatDate = (value) => {
    if (!value) return "-";

    if (typeof value === "string") return value;

    if (value?.toDate) {
        return value.toDate().toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "2-digit"
        });
    }

    return "-";
};

const getCreatedAtMillis = (value) => {
    if (!value) return 0;

    if (typeof value === "string") {
        const parsedValue = Date.parse(value);
        return Number.isNaN(parsedValue) ? 0 : parsedValue;
    }

    if (value?.toDate) {
        return value.toDate().getTime();
    }

    return 0;
};

const Profile = () => {
    const navigate = useNavigate();
    const [postType, setPostType] = useState("Articles");
    const [currentUser, setCurrentUser] = useState(null);
    const [myArticles, setMyArticles] = useState([]);
    const [myQuestions, setMyQuestions] = useState([]);
    const [articleReactions, setArticleReactions] = useState({});
    const [questionReactions, setQuestionReactions] = useState({});
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);

    const sortedMyArticles = useMemo(
        () => [...myArticles].sort((firstItem, secondItem) => getCreatedAtMillis(secondItem.createdAt) - getCreatedAtMillis(firstItem.createdAt)),
        [myArticles]
    );

    const sortedMyQuestions = useMemo(
        () => [...myQuestions].sort((firstItem, secondItem) => getCreatedAtMillis(secondItem.createdAt) - getCreatedAtMillis(firstItem.createdAt)),
        [myQuestions]
    );

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const unsubscribe = subscribeOwnedItems({
            uid: currentUser?.uid,
            collectionName: COLLECTION_NAMES.articles,
            onItems: setMyArticles,
            onEmpty: () => setMyArticles([])
        });

        return unsubscribe;
    }, [currentUser?.uid]);

    useEffect(() => {
        const unsubscribe = subscribeOwnedItems({
            uid: currentUser?.uid,
            collectionName: COLLECTION_NAMES.questions,
            onItems: setMyQuestions,
            onEmpty: () => setMyQuestions([])
        });

        return unsubscribe;
    }, [currentUser?.uid]);

    useEffect(() => {
        const unsubscribe = subscribeReactionMap({
            uid: currentUser?.uid,
            collectionName: COLLECTION_NAMES.articles,
            items: myArticles,
            setReactions: setArticleReactions
        });

        return unsubscribe;
    }, [currentUser?.uid, myArticles]);

    useEffect(() => {
        const unsubscribe = subscribeReactionMap({
            uid: currentUser?.uid,
            collectionName: COLLECTION_NAMES.questions,
            items: myQuestions,
            setReactions: setQuestionReactions
        });

        return unsubscribe;
    }, [currentUser?.uid, myQuestions]);

    const handlePostReaction = async (collectionName, postId, field) => {
        if (!currentUser) {
            alert("Please log in before voting.");
            return;
        }

        try {
            const postRef = doc(db, collectionName, postId);
            const reactionRef = doc(db, collectionName, postId, "reactions", currentUser.uid);

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

    const displayName = currentUser?.displayName || "User";
    const handle = currentUser?.email ? `@${currentUser.email.split("@")[0]}` : "@user";

    const handleOpenMenu = (event) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setMenuAnchorEl(null);
    };

    const syncDisplayNameToExistingContent = async (uid, nextDisplayName) => {
        const articlesQuery = query(collection(db, COLLECTION_NAMES.articles), where("uid", "==", uid));
        const questionsQuery = query(collection(db, COLLECTION_NAMES.questions), where("uid", "==", uid));

        const [articlesSnap, questionsSnap] = await Promise.all([
            getDocs(articlesQuery),
            getDocs(questionsQuery)
        ]);

        const articleUpdates = articlesSnap.docs.map((docItem) => updateDoc(docItem.ref, {
            author: nextDisplayName,
            updatedAt: serverTimestamp()
        }));

        const questionUpdates = questionsSnap.docs.map((docItem) => updateDoc(docItem.ref, {
            author: nextDisplayName,
            updatedAt: serverTimestamp()
        }));

        await Promise.allSettled([...articleUpdates, ...questionUpdates]);
    };

    const handleEditProfile = async () => {
        handleCloseMenu();

        const activeUser = auth.currentUser;

        if (!activeUser) {
            alert("Please log in first.");
            return;
        }

        const currentDisplayName = activeUser.displayName || "";
        const nextDisplayName = window.prompt("Enter your new display name", currentDisplayName);

        if (nextDisplayName === null) {
            return;
        }

        const trimmedDisplayName = nextDisplayName.trim();

        if (!trimmedDisplayName) {
            alert("Display name cannot be empty.");
            return;
        }

        if (trimmedDisplayName === currentDisplayName) {
            return;
        }

        try {
            await updateProfile(activeUser, {
                displayName: trimmedDisplayName
            });

            await setDoc(doc(db, "users", activeUser.uid), {
                uid: activeUser.uid,
                email: activeUser.email || "",
                name: trimmedDisplayName,
                updatedAt: serverTimestamp()
            }, { merge: true });
            setCurrentUser({ ...activeUser });
        } catch (error) {
            if (error?.code === "auth/requires-recent-login") {
                alert("Please log in again, then try updating your profile.");
                return;
            }

            alert(`Failed to update profile (${error?.code || "unknown"}).`);
            return;
        }

        try {
            await syncDisplayNameToExistingContent(activeUser.uid, trimmedDisplayName);
        } catch (error) {
            alert("Profile updated, but failed to sync old posts/questions.");
        }
    };

    const handleDeleteAccount = async () => {
        handleCloseMenu();

        const activeUser = auth.currentUser;

        if (!activeUser) {
            alert("Please log in first.");
            return;
        }

        const shouldDelete = window.confirm("Delete your account permanently? This action cannot be undone.");

        if (!shouldDelete) {
            return;
        }

        if (!activeUser.email) {
            alert("Cannot verify account email for deletion.");
            return;
        }

        const password = window.prompt("Enter your password to confirm account deletion");

        if (password === null) {
            return;
        }

        if (!password.trim()) {
            alert("Password is required.");
            return;
        }

        try {
            const credential = EmailAuthProvider.credential(activeUser.email, password.trim());
            await reauthenticateWithCredential(activeUser, credential);
            await deleteDoc(doc(db, COLLECTION_NAMES.users, activeUser.uid));
            await deleteUser(activeUser);
            navigate("/register", { replace: true });
        } catch (error) {
            alert("Failed to delete account. Please verify your password and try again.");
        }
    };

    return (
        <Box
            sx={{
                mt: 15,
                width: "90%",
                maxWidth: "1100px",
                margin: "0 auto",
                paddingTop: "100px"
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontSize: { xs: "48px", md: "64px" }, fontWeight: 700, lineHeight: 1 }}>
                    {displayName}
                </Typography>
                <IconButton size="small" onClick={handleOpenMenu}>
                    <MoreHorizIcon sx={{ fontSize: 30, color: "text.secondary" }} />
                </IconButton>
            </Box>

            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleCloseMenu}
            >
                <MenuItem onClick={handleEditProfile}>Edit</MenuItem>
                <MenuItem onClick={handleDeleteAccount}>Delete</MenuItem>
            </Menu>

            <Typography sx={{ mt: 2, color: "text.secondary", fontSize: "32px" }}>
                {handle}
            </Typography>

            <Box sx={{ mt: 3, mb: 4, display: "flex", justifyContent: "flex-end" }}>
                <SortDropdown
                    value={postType}
                    onChange={setPostType}
                    options={PROFILE_POST_TYPE_OPTIONS}
                    minWidth={170}
                />
            </Box>

            {postType === "Articles" ? (
                <>
                    {sortedMyArticles.length > 0 ? (
                        sortedMyArticles.map((article) => (
                            <ArticleCard
                                key={article.id}
                                title={article.title}
                                description={article.description || article.content}
                                date={formatDate(article.createdAt)}
                                author={article.author || displayName}
                                image={article.image}
                                likes={article.likes ?? 0}
                                dislikes={article.dislikes ?? 0}
                                liked={articleReactions[article.id] === "likes"}
                                disliked={articleReactions[article.id] === "dislikes"}
                                onLike={() => handlePostReaction(COLLECTION_NAMES.articles, article.id, "likes")}
                                onDislike={() => handlePostReaction(COLLECTION_NAMES.articles, article.id, "dislikes")}
                                linkTo={`/articles/${article.id}`}
                            />
                        ))
                    ) : (
                        <Typography color="text.secondary">You have no articles yet</Typography>
                    )}
                </>
            ) : (
                <>
                    {sortedMyQuestions.length > 0 ? (
                        sortedMyQuestions.map((question) => (
                            <QnACard
                                key={question.id}
                                title={question.title}
                                date={formatDate(question.createdAt)}
                                author={question.author || displayName}
                                likes={question.likes ?? 0}
                                dislikes={question.dislikes ?? 0}
                                liked={questionReactions[question.id] === "likes"}
                                disliked={questionReactions[question.id] === "dislikes"}
                                onLike={() => handlePostReaction(COLLECTION_NAMES.questions, question.id, "likes")}
                                onDislike={() => handlePostReaction(COLLECTION_NAMES.questions, question.id, "dislikes")}
                                linkTo={`/qna/${question.id}`}
                            />
                        ))
                    ) : (
                        <Typography color="text.secondary">You have no questions yet</Typography>
                    )}
                </>
            )}
        </Box>
    );
};

export default Profile;
