import './App.css';

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import { APP_ROUTE_CONFIG } from "./routes/appRoutesConfig";

function AppContent() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default", color: "text.primary" }}>
      <Navbar />
      <Box sx={{ flex: 1 }}>
        <Routes>
          {APP_ROUTE_CONFIG.map((route) => (
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