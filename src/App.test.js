import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock(
  "react-router-dom",
  () => require("./test-utils").createReactRouterDomMock(),
  { virtual: true }
);

jest.mock("./components/Navbar", () => () => <div>Navbar</div>);
jest.mock("./components/Footer", () => () => <div>Footer</div>);
jest.mock("./components/ProtectedRoute", () => ({ children }) => <>{children}</>);
jest.mock("./pages/Home", () => () => <div>Home</div>);
jest.mock("./pages/Articles", () => () => <div>Articles</div>);
jest.mock("./pages/QnA", () => () => <div>QnA</div>);
jest.mock("./pages/Login", () => () => <div>Login</div>);
jest.mock("./pages/Register", () => () => <div>Register</div>);
jest.mock("./pages/NewPost", () => () => <div>NewPost</div>);
jest.mock("./pages/EditPost", () => () => <div>EditPost</div>);
jest.mock("./pages/ArticleContent", () => () => <div>ArticleContent</div>);
jest.mock("./pages/QuestionContent", () => () => <div>QuestionContent</div>);
jest.mock("./pages/Profile", () => () => <div>Profile</div>);

const renderApp = () => render(<App />);

describe("App", () => {
  it("renders app shell", () => {
    renderApp();

    expect(screen.getByTestId("browser-router")).toBeInTheDocument();
    expect(screen.getByText("Navbar")).toBeInTheDocument();
    expect(screen.getByTestId("routes")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });
});
