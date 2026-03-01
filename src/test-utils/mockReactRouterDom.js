import React from "react";

export const createReactRouterDomMock = ({ params = { id: "1" }, navigate = jest.fn() } = {}) => ({
    BrowserRouter: ({ children }) => <div data-testid="browser-router">{children}</div>,
    Routes: ({ children }) => <div data-testid="routes">{children}</div>,
    Route: ({ element }) => <>{element}</>,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
    useNavigate: () => navigate,
    useParams: () => params
});
