import { Navigate, Route, Routes } from "react-router-dom";
import Activate from "./pages/Activate.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Login from "./pages/Login.jsx";
import Me from "./pages/Me.jsx";
import Register from "./pages/Register.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import IndexRedirect from "./routes/IndexRedirect.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<IndexRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/activate" element={<Activate />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/me" element={<Me />} />
        {/* Rotas privadas (e-commerce) preparadas para crescimento */}
        <Route path="/cart" element={<ComingSoon title="Carrinho" />} />
        <Route path="/checkout" element={<ComingSoon title="Checkout" />} />
        <Route path="/orders" element={<ComingSoon title="Pedidos" />} />
        <Route path="/addresses" element={<ComingSoon title="Endereços" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
