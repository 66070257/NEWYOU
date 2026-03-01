export const APP_ROUTES = {
    HOME: "/",
    ARTICLES: "/articles",
    QNA: "/qna",
    PROFILE: "/profile",
    LOGIN: "/login",
    REGISTER: "/register",
    NEW_POST: "/new-post",
    NEW_POST_QNA: "/new-post-qna",
    EDIT_POST: "/edit-post/:postType/:id"
};

export const articleContentRoute = (id) => `${APP_ROUTES.ARTICLES}/${id}`;
export const qnaContentRoute = (id) => `${APP_ROUTES.QNA}/${id}`;
export const editPostRoute = (postType, id) => (
    APP_ROUTES.EDIT_POST.replace(":postType", postType).replace(":id", id)
);
