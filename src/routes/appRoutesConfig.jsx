import React from "react";
import Home from "../pages/Home";
import Articles from "../pages/Articles";
import QnA from "../pages/QnA";
import Login from "../pages/Login";
import Register from "../pages/Register";
import NewPost from "../pages/NewPost";
import EditPost from "../pages/EditPost";
import ArticleContent from "../pages/ArticleContent";
import QuestionContent from "../pages/QuestionContent";
import Profile from "../pages/Profile";
import { APP_ROUTES } from "../constants/routes";

export const APP_ROUTE_CONFIG = [
    { path: APP_ROUTES.HOME, element: <Home /> },
    { path: APP_ROUTES.ARTICLES, element: <Articles /> },
    { path: APP_ROUTES.QNA, element: <QnA /> },
    { path: APP_ROUTES.PROFILE, element: <Profile />, protected: true },
    { path: APP_ROUTES.LOGIN, element: <Login /> },
    { path: APP_ROUTES.REGISTER, element: <Register /> },
    { path: APP_ROUTES.NEW_POST, element: <NewPost />, protected: true },
    { path: APP_ROUTES.NEW_POST_QNA, element: <NewPost />, protected: true },
    { path: APP_ROUTES.EDIT_POST, element: <EditPost />, protected: true },
    { path: `${APP_ROUTES.ARTICLES}/:id`, element: <ArticleContent /> },
    { path: `${APP_ROUTES.QNA}/:id`, element: <QuestionContent /> }
];
