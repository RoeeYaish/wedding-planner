import { Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import ProtectedRoute from "@/routes/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* Public route: /login */}
      <Route path="/login" element={<Login />} />

      {/* Protected block */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
