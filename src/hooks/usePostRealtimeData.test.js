import { renderHook, act, waitFor } from "@testing-library/react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { mapSnapshotDocs } from "../utils/firestore";
import {
    createAuthStateEmitter,
    createSnapshotCallbackRegistry,
    setupFirestoreReferenceMocks
} from "../test-utils";
import usePostRealtimeData from "./usePostRealtimeData";

jest.mock("firebase/auth", () => ({
    onAuthStateChanged: jest.fn()
}));

jest.mock("firebase/firestore", () => ({
    collection: jest.fn(),
    doc: jest.fn(),
    onSnapshot: jest.fn(),
    orderBy: jest.fn(),
    query: jest.fn()
}));

jest.mock("../database/firebase", () => ({
    auth: {},
    db: {}
}));

jest.mock("../utils/firestore", () => ({
    mapSnapshotDocs: jest.fn()
}));

describe("usePostRealtimeData", () => {
    let authEmitter;
    let snapshots;

    const renderPostRealtimeHook = () => renderHook(() =>
        usePostRealtimeData({ collectionName: "articles", postId: "post-1" })
    );

    const emitAuthState = (user) => {
        act(() => {
            authEmitter.emit(user);
        });
    };

    const getSnapshotCallbackByDocPath = (...expectedPath) => {
        return snapshots.getDocCallbackByPath(...expectedPath);
    };

    const getCommentsQueryCallback = () => snapshots.getFirstQueryCallback();

    beforeEach(() => {
        setupFirestoreReferenceMocks({ collection, orderBy, query, doc });
        authEmitter = createAuthStateEmitter({ onAuthStateChanged });
        snapshots = createSnapshotCallbackRegistry({ onSnapshot });

        mapSnapshotDocs.mockReturnValue([]);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("sets post to null when post snapshot does not exist", () => {
        const { result } = renderPostRealtimeHook();
        const postCallback = getSnapshotCallbackByDocPath("articles", "post-1");

        expect(result.current.isPostResolved).toBe(false);

        act(() => {
            postCallback({
                exists: () => true,
                id: "post-1",
                data: () => ({ title: "Hello" })
            });
        });

        expect(result.current.post).toEqual({ id: "post-1", title: "Hello" });
        expect(result.current.isPostResolved).toBe(true);

        act(() => {
            postCallback({
                exists: () => false
            });
        });

        expect(result.current.post).toBeNull();
        expect(result.current.isPostResolved).toBe(true);
    });

    it("subscribes reaction using current auth user and resets reaction on logout", async () => {
        const { result } = renderPostRealtimeHook();

        emitAuthState({ uid: "user-1" });

        await waitFor(() => {
            expect(doc).toHaveBeenCalledWith({}, "articles", "post-1", "reactions", "user-1");
        });

        const postReactionCallback = getSnapshotCallbackByDocPath("articles", "post-1", "reactions", "user-1");

        act(() => {
            postReactionCallback({
                exists: () => true,
                data: () => ({ type: "likes" })
            });
        });

        expect(result.current.postReaction).toBe("likes");

        emitAuthState(null);

        await waitFor(() => {
            expect(result.current.postReaction).toBeNull();
        });
    });

    it("resets comment reactions to empty object when comments become empty", async () => {
        const { result } = renderPostRealtimeHook();
        emitAuthState({ uid: "user-1" });

        const commentsQueryCallback = getCommentsQueryCallback();

        mapSnapshotDocs.mockReturnValueOnce([{ id: "comment-1", text: "hello" }]);

        act(() => {
            commentsQueryCallback({ docs: [{ id: "comment-1" }] });
        });

        await waitFor(() => {
            expect(
                getSnapshotCallbackByDocPath("articles", "post-1", "comments", "comment-1", "reactions", "user-1")
            ).toBeDefined();
        });

        const commentReactionCallback = getSnapshotCallbackByDocPath(
            "articles",
            "post-1",
            "comments",
            "comment-1",
            "reactions",
            "user-1"
        );

        act(() => {
            commentReactionCallback({
                exists: () => true,
                data: () => ({ type: "likes" })
            });
        });

        await waitFor(() => {
            expect(result.current.commentReactions).toEqual({ "comment-1": "likes" });
        });

        mapSnapshotDocs.mockReturnValueOnce([]);

        act(() => {
            commentsQueryCallback({ docs: [] });
        });

        await waitFor(() => {
            expect(result.current.commentReactions).toEqual({});
        });
    });
});
