import React from "react";
import PostContentPage from "../components/PostContentPage";
import { FIRESTORE_COLLECTIONS } from "../constants/collections";
import { APP_ROUTES } from "../constants/routes";

const QuestionContent = () => (
    <PostContentPage
        collectionName={FIRESTORE_COLLECTIONS.QUESTIONS}
        label="QUESTION"
        notFoundText="Question not found"
        imageAlt="question"
        editPostType="qna"
        deleteConfirmText="Delete this question?"
        deleteFailText="Failed to delete question."
        navigateAfterDelete={APP_ROUTES.QNA}
        getBodyText={(post) => post.content || post.details}
        getEditInitialData={(post) => ({
            title: post.title || "",
            details: post.details || post.content || "",
            image: post.image || ""
        })}
    />
);

export default QuestionContent;
