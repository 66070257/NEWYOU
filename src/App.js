import './App.css';

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Articles from "./pages/Articles";
import QnA from "./pages/QnA";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NewPost from "./pages/NewPost";
import EditPost from "./pages/EditPost";
import ArticleContent from "./pages/ArticleContent";
import QuestionContent from "./pages/QuestionContent";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

const ROUTES = [
  { path: "/", element: <Home /> },
  { path: "/articles", element: <Articles /> },
  { path: "/qna", element: <QnA /> },
  { path: "/profile", element: <Profile />, protected: true },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/new-post", element: <NewPost />, protected: true },
  { path: "/new-post-qna", element: <NewPost />, protected: true },
  { path: "/edit-post/:postType/:id", element: <EditPost />, protected: true },
  { path: "/articles/:id", element: <ArticleContent /> },
  { path: "/qna/:id", element: <QuestionContent /> }
];

function AppContent() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default", color: "text.primary" }}>
      <Navbar />
      <Box sx={{ flex: 1 }}>
        <Routes>
          {ROUTES.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={route.protected ? <ProtectedRoute>{route.element}</ProtectedRoute> : route.element}
            />
          ))}
        </Routes>
      </Box>
      <Footer />
    </Box>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;