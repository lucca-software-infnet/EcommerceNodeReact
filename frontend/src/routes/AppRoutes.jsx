import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute.jsx";
import ComingSoon from "../components/ComingSoon.jsx";

import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import Activate from "../pages/auth/Activate.jsx";
import ForgotPassword from "../pages/auth/ForgotPassword.jsx";
import ResetPassword from "../pages/auth/ResetPassword.jsx";

import Me from "../pages/account/Me.jsx";
import Home from "../pages/Home.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Home pública (NUNCA redirecionar / para /login automaticamente) */}
      <Route path="/" element={<Home />} />

      {/* Público (auth) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/activate" element={<Activate />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Privado (e-commerce / conta) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/me" element={<Me />} />
        <Route path="/cart" element={<ComingSoon title="Carrinho" />} />
        <Route path="/checkout" element={<ComingSoon title="Checkout" />} />
        <Route path="/orders" element={<ComingSoon title="Pedidos" />} />
        <Route path="/addresses" element={<ComingSoon title="Endereços" />} />
        <Route path="/sales" element={<ComingSoon title="Minhas vendas" />} />
        <Route path="/settings" element={<ComingSoon title="Configurações" />} />
        <Route path="/help" element={<ComingSoon title="Ajuda" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

