import usePostActions from "./usePostActions";
import usePostRealtimeData from "./usePostRealtimeData";

const usePostContentData = ({ collectionName, postId }) => {
    const {
        post,
        isPostResolved,
        currentUser,
        comments,
        postReaction,
        commentReactions
    } = usePostRealtimeData({ collectionName, postId });

    const {
        commentInput,
        setCommentInput,
        isSubmittingComment,
        isUpdatingCommentId,
        handleAddComment: handleAddCommentAction,
        handleCommentReaction: handleCommentReactionAction,
        handleUpdateComment: handleUpdateCommentAction,
        handlePostReaction: handlePostReactionAction
    } = usePostActions({ collectionName, postId, comments });

    return {
        post,
        isPostResolved,
        currentUser,
        postReaction,
        commentInput,
        setCommentInput,
        comments,
        commentReactions,
        isSubmittingComment,
        isUpdatingCommentId,
        handleAddCommentAction,
        handleCommentReactionAction,
        handleUpdateCommentAction,
        handlePostReactionAction
    };
};

export default usePostContentData;
