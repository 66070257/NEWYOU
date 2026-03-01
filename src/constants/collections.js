export const FIRESTORE_COLLECTIONS = {
    ARTICLES: "articles",
    QUESTIONS: "questions",
    USERS: "users",
    COMMENTS: "comments",
    REACTIONS: "reactions"
};

export const getCollectionByPostType = (postType) => (
    postType === "qna" ? FIRESTORE_COLLECTIONS.QUESTIONS : FIRESTORE_COLLECTIONS.ARTICLES
);
