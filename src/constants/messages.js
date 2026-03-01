export const ALERT_MESSAGES = {
    AUTH_REQUIRED_FOR_VOTE: "Please log in before voting.",
    AUTH_REQUIRED_FOR_COMMENT: "Please log in before commenting.",
    AUTH_REQUIRED_FOR_COMMENT_EDIT: "Please log in before editing comments.",
    AUTH_REQUIRED_FOR_POST_CREATE: "Please log in before creating a post.",
    AUTH_REQUIRED_FOR_POST_EDIT: "Please log in before editing a post.",
    AUTH_REQUIRED_GENERAL: "Please log in first.",
    AUTH_RELOGIN_REQUIRED: "Please log in again, then try updating your profile.",

    FIREBASE_NOT_CONFIGURED: "Firebase is not configured. Please set environment variables in .env.",
    FIREBASE_STORAGE_NOT_CONFIGURED: "Firebase Storage is not configured.",

    POST_REACTION_UPDATE_FAILED: "Failed to update post reaction.",
    REACTION_UPDATE_FAILED: "Failed to update reaction.",

    COMMENT_EMPTY: "Comment cannot be empty.",
    COMMENT_UPDATE_FAILED: "Failed to update comment.",
    COMMENT_EDIT_NOT_OWNER: "You can only edit your own comments.",
    COMMENT_ADD_FAILED: "Failed to add comment.",

    POST_FIELDS_REQUIRED_ARTICLE: "Please enter both Title and Content.",
    POST_FIELDS_REQUIRED_QUESTION: "Please enter both Title and Details.",
    POST_SAVE_FAILED_ARTICLE: "Failed to save article.",
    POST_SAVE_FAILED_QUESTION: "Failed to save question.",
    POST_UPDATE_FAILED_ARTICLE: "Failed to update article.",
    POST_UPDATE_FAILED_QUESTION: "Failed to update question.",

    POST_NOT_FOUND: "Post not found.",
    POST_LOAD_FAILED_FOR_EDIT: "Failed to load post for editing.",

    PROFILE_DISPLAY_NAME_EMPTY: "Display name cannot be empty.",
    PROFILE_SYNC_FAILED: "Profile updated, but failed to sync old posts/questions.",

    ACCOUNT_DELETE_EMAIL_UNAVAILABLE: "Cannot verify account email for deletion.",
    ACCOUNT_DELETE_PASSWORD_REQUIRED: "Password is required.",
    ACCOUNT_DELETE_FAILED: "Failed to delete account. Please verify your password and try again.",

    LOGIN_MISSING_FIELDS: "Please enter both Email and Password.",
    REGISTER_MISSING_FIELDS: "Please fill in all fields.",

    IMAGE_ONLY_ALLOWED: "Please select an image file only.",
    IMAGE_UPLOAD_SERVER_DOWN: "Image upload failed: upload server is not running (run npm run server)."
};
