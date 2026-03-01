import React, { useEffect, useMemo, useState } from "react";
import { Box, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { EmailAuthProvider, deleteUser, onAuthStateChanged, reauthenticateWithCredential, updateProfile } from "firebase/auth";
import { collection, deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import ArticleCard from "../components/ArticleCard";
import QnACard from "../components/QnACard";
import SortDropdown from "../components/SortDropdown";
import { auth, db } from "../database/firebase";
import { FIRESTORE_COLLECTIONS } from "../constants/collections";
import { LIST_PAGE_CONTAINER_SX } from "../constants/layout";
import { APP_ROUTES, articleContentRoute, qnaContentRoute } from "../constants/routes";
import { ALERT_MESSAGES } from "../constants/messages";
import { PROFILE_UI_TEXT } from "../constants/uiText";
import { formatDate, getCreatedAtMillis } from "../utils/date";
import { mapSnapshotDocs } from "../utils/firestore";
import { applyReactionTransaction } from "../utils/reactions";

const PROFILE_POST_TYPE_OPTIONS = [
    { value: "Articles", label: "Articles" },
    { value: "Q&A", label: "Q&A" }
];

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
        const reactionRef = doc(db, collectionName, item.id, FIRESTORE_COLLECTIONS.REACTIONS, uid);

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
            collectionName: FIRESTORE_COLLECTIONS.ARTICLES,
            onItems: setMyArticles,
            onEmpty: () => setMyArticles([])
        });

        return unsubscribe;
    }, [currentUser?.uid]);

    useEffect(() => {
        const unsubscribe = subscribeOwnedItems({
            uid: currentUser?.uid,
            collectionName: FIRESTORE_COLLECTIONS.QUESTIONS,
            onItems: setMyQuestions,
            onEmpty: () => setMyQuestions([])
        });

        return unsubscribe;
    }, [currentUser?.uid]);

    useEffect(() => {
        const unsubscribe = subscribeReactionMap({
            uid: currentUser?.uid,
            collectionName: FIRESTORE_COLLECTIONS.ARTICLES,
            items: myArticles,
            setReactions: setArticleReactions
        });

        return unsubscribe;
    }, [currentUser?.uid, myArticles]);

    useEffect(() => {
        const unsubscribe = subscribeReactionMap({
            uid: currentUser?.uid,
            collectionName: FIRESTORE_COLLECTIONS.QUESTIONS,
            items: myQuestions,
            setReactions: setQuestionReactions
        });

        return unsubscribe;
    }, [currentUser?.uid, myQuestions]);

    const handlePostReaction = async (collectionName, postId, field) => {
        if (!currentUser) {
            alert(ALERT_MESSAGES.AUTH_REQUIRED_FOR_VOTE);
            return;
        }

        try {
            const postRef = doc(db, collectionName, postId);
            const reactionRef = doc(db, collectionName, postId, FIRESTORE_COLLECTIONS.REACTIONS, currentUser.uid);

            await applyReactionTransaction({
                db,
                itemRef: postRef,
                reactionRef,
                field,
                uid: currentUser.uid
            });
        } catch (error) {
            alert(ALERT_MESSAGES.POST_REACTION_UPDATE_FAILED);
        }
    };

    const displayName = currentUser?.displayName || PROFILE_UI_TEXT.DEFAULT_DISPLAY_NAME;
    const handle = currentUser?.email ? `@${currentUser.email.split("@")[0]}` : PROFILE_UI_TEXT.DEFAULT_HANDLE;

    const handleOpenMenu = (event) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setMenuAnchorEl(null);
    };

    const syncDisplayNameToExistingContent = async (uid, nextDisplayName) => {
        const articlesQuery = query(collection(db, FIRESTORE_COLLECTIONS.ARTICLES), where("uid", "==", uid));
        const questionsQuery = query(collection(db, FIRESTORE_COLLECTIONS.QUESTIONS), where("uid", "==", uid));

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

        const syncResults = await Promise.allSettled([...articleUpdates, ...questionUpdates]);
        const hasFailedSync = syncResults.some((result) => result.status === "rejected");

        if (hasFailedSync) {
            throw new Error("Failed to sync some existing content author names.");
        }
    };

    const handleEditProfile = async () => {
        handleCloseMenu();

        const activeUser = auth.currentUser;

        if (!activeUser) {
            alert(ALERT_MESSAGES.AUTH_REQUIRED_GENERAL);
            return;
        }

        const currentDisplayName = activeUser.displayName || "";
        const nextDisplayName = window.prompt(PROFILE_UI_TEXT.PROMPT_EDIT_DISPLAY_NAME, currentDisplayName);

        if (nextDisplayName === null) {
            return;
        }

        const trimmedDisplayName = nextDisplayName.trim();

        if (!trimmedDisplayName) {
            alert(ALERT_MESSAGES.PROFILE_DISPLAY_NAME_EMPTY);
            return;
        }

        if (trimmedDisplayName === currentDisplayName) {
            return;
        }

        try {
            await updateProfile(activeUser, {
                displayName: trimmedDisplayName
            });

            await setDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, activeUser.uid), {
                uid: activeUser.uid,
                email: activeUser.email || "",
                name: trimmedDisplayName,
                updatedAt: serverTimestamp()
            }, { merge: true });
            setCurrentUser({ ...activeUser });
        } catch (error) {
            if (error?.code === "auth/requires-recent-login") {
                alert(ALERT_MESSAGES.AUTH_RELOGIN_REQUIRED);
                return;
            }

            alert(`Failed to update profile (${error?.code || "unknown"}).`);
            return;
        }

        try {
            await syncDisplayNameToExistingContent(activeUser.uid, trimmedDisplayName);
        } catch (error) {
            alert(ALERT_MESSAGES.PROFILE_SYNC_FAILED);
        }
    };

    const handleDeleteAccount = async () => {
        handleCloseMenu();

        const activeUser = auth.currentUser;

        if (!activeUser) {
            alert(ALERT_MESSAGES.AUTH_REQUIRED_GENERAL);
            return;
        }

        const shouldDelete = window.confirm(PROFILE_UI_TEXT.DELETE_CONFIRM);

        if (!shouldDelete) {
            return;
        }

        if (!activeUser.email) {
            alert(ALERT_MESSAGES.ACCOUNT_DELETE_EMAIL_UNAVAILABLE);
            return;
        }

        const password = window.prompt(PROFILE_UI_TEXT.DELETE_PASSWORD_PROMPT);

        if (password === null) {
            return;
        }

        if (!password.trim()) {
            alert(ALERT_MESSAGES.ACCOUNT_DELETE_PASSWORD_REQUIRED);
            return;
        }

        try {
            const credential = EmailAuthProvider.credential(activeUser.email, password.trim());
            await reauthenticateWithCredential(activeUser, credential);
            await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, activeUser.uid));
            await deleteUser(activeUser);
            navigate(APP_ROUTES.REGISTER, { replace: true });
        } catch (error) {
            alert(ALERT_MESSAGES.ACCOUNT_DELETE_FAILED);
        }
    };

    return (
        <Box
            sx={LIST_PAGE_CONTAINER_SX}
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
                <MenuItem onClick={handleEditProfile}>{PROFILE_UI_TEXT.MENU_EDIT}</MenuItem>
                <MenuItem onClick={handleDeleteAccount}>{PROFILE_UI_TEXT.MENU_DELETE}</MenuItem>
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
                                onLike={() => handlePostReaction(FIRESTORE_COLLECTIONS.ARTICLES, article.id, "likes")}
                                onDislike={() => handlePostReaction(FIRESTORE_COLLECTIONS.ARTICLES, article.id, "dislikes")}
                                linkTo={articleContentRoute(article.id)}
                            />
                        ))
                    ) : (
                        <Typography color="text.secondary">{PROFILE_UI_TEXT.OWN_ARTICLES_EMPTY}</Typography>
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
                                onLike={() => handlePostReaction(FIRESTORE_COLLECTIONS.QUESTIONS, question.id, "likes")}
                                onDislike={() => handlePostReaction(FIRESTORE_COLLECTIONS.QUESTIONS, question.id, "dislikes")}
                                linkTo={qnaContentRoute(question.id)}
                            />
                        ))
                    ) : (
                        <Typography color="text.secondary">{PROFILE_UI_TEXT.OWN_QUESTIONS_EMPTY}</Typography>
                    )}
                </>
            )}
        </Box>
    );
};

export default Profile;
