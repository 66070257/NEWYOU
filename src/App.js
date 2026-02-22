import './App.css';

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Articles from "./pages/Articles";
import QnA from "./pages/QnA";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NewPost from "./pages/NewPostArtcle";
import NewPostQnA from "./pages/NewPostQuestion";
import ArticleContent from "./pages/ArticleContent";
import QuestionContent from "./pages/QuestionContent";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

function AppContent() {

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/qna" element={<QnA />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/new-post" element={<ProtectedRoute><NewPost /></ProtectedRoute>} />
        <Route path="/new-post-qna" element={<ProtectedRoute><NewPostQnA /></ProtectedRoute>} />
        <Route path="/articles/:id" element={<ArticleContent />} />
        <Route path="/qna/:id" element={<QuestionContent />} />
      </Routes>
    </>
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