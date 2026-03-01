import { render, screen } from "@testing-library/react";
import PostContentPage from "./PostContentPage";
import usePostContentData from "../hooks/usePostContentData";

jest.mock(
    "react-router-dom",
    () => require("../test-utils").createReactRouterDomMock({ params: { id: "post-1" } }),
    { virtual: true }
);

jest.mock("firebase/firestore", () => ({
    deleteDoc: jest.fn(),
    doc: jest.fn()
}));

jest.mock("../database/firebase", () => ({
    db: {}
}));

jest.mock("../hooks/usePostContentData", () => jest.fn());

const mockUsePostContentData = usePostContentData;

const renderPage = () => render(
    <PostContentPage
        collectionName="articles"
        label="ARTICLE"
        notFoundText="Article not found"
        imageAlt="article"
        editPostType="article"
        deleteConfirmText="Delete this article?"
        deleteFailText="Failed to delete article."
        navigateAfterDelete="/articles"
        getBodyText={(post) => post.content || post.description}
        getEditInitialData={(post) => ({
            title: post.title || "",
            content: post.content || post.description || "",
            image: post.image || ""
        })}
    />
);

describe("PostContentPage", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("shows loading state before post is resolved", () => {
        mockUsePostContentData.mockReturnValue({
            post: null,
            isPostResolved: false,
            currentUser: null,
            postReaction: null,
            commentInput: "",
            setCommentInput: jest.fn(),
            comments: [],
            commentReactions: {},
            isSubmittingComment: false,
            isUpdatingCommentId: null,
            handleAddCommentAction: jest.fn(),
            handleCommentReactionAction: jest.fn(),
            handleUpdateCommentAction: jest.fn(),
            handlePostReactionAction: jest.fn()
        });

        renderPage();

        expect(screen.getByText("Loading...")).toBeInTheDocument();
        expect(screen.queryByText("Article not found")).not.toBeInTheDocument();
    });

    it("shows not found text when post is resolved but missing", () => {
        mockUsePostContentData.mockReturnValue({
            post: null,
            isPostResolved: true,
            currentUser: null,
            postReaction: null,
            commentInput: "",
            setCommentInput: jest.fn(),
            comments: [],
            commentReactions: {},
            isSubmittingComment: false,
            isUpdatingCommentId: null,
            handleAddCommentAction: jest.fn(),
            handleCommentReactionAction: jest.fn(),
            handleUpdateCommentAction: jest.fn(),
            handlePostReactionAction: jest.fn()
        });

        renderPage();

        expect(screen.getByText("Article not found")).toBeInTheDocument();
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
});
