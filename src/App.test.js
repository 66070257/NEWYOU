import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock(
  "react-router-dom",
  () => ({
    BrowserRouter: ({ children }) => <div data-testid="browser-router">{children}</div>,
    Routes: ({ children }) => <div data-testid="routes">{children}</div>,
    Route: ({ element }) => <>{element}</>,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
    useNavigate: () => jest.fn(),
    useParams: () => ({ id: "1" })
  }),
  { virtual: true }
);

jest.mock("./components/Navbar", () => () => <div>Navbar</div>);
jest.mock("./components/ProtectedRoute", () => ({ children }) => <>{children}</>);
jest.mock("./pages/Home", () => () => <div>Home</div>);
jest.mock("./pages/Articles", () => () => <div>Articles</div>);
jest.mock("./pages/QnA", () => () => <div>QnA</div>);
jest.mock("./pages/Login", () => () => <div>Login</div>);
jest.mock("./pages/Register", () => () => <div>Register</div>);
jest.mock("./pages/NewPostArtcle", () => () => <div>NewPostArticle</div>);
jest.mock("./pages/NewPostQuestion", () => () => <div>NewPostQuestion</div>);
jest.mock("./pages/ArticleContent", () => () => <div>ArticleContent</div>);
jest.mock("./pages/QuestionContent", () => () => <div>QuestionContent</div>);
jest.mock("./pages/Profile", () => () => <div>Profile</div>);

test("renders app shell", () => {
  render(<App />);
  expect(screen.getByText("Navbar")).toBeInTheDocument();
  expect(screen.getByTestId("routes")).toBeInTheDocument();
});
