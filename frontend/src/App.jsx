import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Me from "./pages/Me.jsx";
import Activate from "./pages/Activate.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import { useAuth } from "./contexts/auth.js";

export default function App() {
  const { isAuthenticated, isInitializing } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isInitializing ? (
            <div style={{ maxWidth: 520, margin: "40px auto" }}>
              <p>Carregando...</p>
            </div>
          ) : isAuthenticated ? (
            <Navigate to="/me" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/activate" element={<Activate />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/me" element={<Me />} />
        {/* rotas privadas futuras: carrinho, checkout, pedidos, endereços, etc */}
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
