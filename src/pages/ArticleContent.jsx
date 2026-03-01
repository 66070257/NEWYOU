import React from "react";
import PostContentPage from "../components/PostContentPage";
import { FIRESTORE_COLLECTIONS } from "../constants/collections";
import { APP_ROUTES } from "../constants/routes";

const ArticleContent = () => (
    <PostContentPage
        collectionName={FIRESTORE_COLLECTIONS.ARTICLES}
        label="ARTICLE"
        notFoundText="Article not found"
        imageAlt="article"
        editPostType="article"
        deleteConfirmText="Delete this article?"
        deleteFailText="Failed to delete article."
        navigateAfterDelete={APP_ROUTES.ARTICLES}
        getBodyText={(post) => post.content || post.description}
        getEditInitialData={(post) => ({
            title: post.title || "",
            content: post.content || post.description || "",
            image: post.image || ""
        })}
    />
);

export default ArticleContent;
