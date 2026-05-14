import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/Layout";
import Visits from "./pages/Visits";
import Logs from "./pages/Logs";
import ProtectedRoute from "./components/ProtectedRoute";
import "./styles/style.css";

const handleLogout = async () => {
  try {
    await api.post("/api/logs/", { action: "User logged out." });
  } catch {
    console.log("Logout log failed (probably expired token)");
  }
  localStorage.clear();
  window.location.href = "/login";
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/visits"
          element={
            <ProtectedRoute>
              <Layout>
                <Visits />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/logs"
          element={
            <ProtectedRoute>
              <Layout>
                <Logs />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
