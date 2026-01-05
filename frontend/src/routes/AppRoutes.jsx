import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute.jsx";
import ComingSoon from "../components/ComingSoon.jsx";

import Home from "../pages/Home.jsx";
import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import Activate from "../pages/auth/Activate.jsx";
import ForgotPassword from "../pages/auth/ForgotPassword.jsx";
import ResetPassword from "../pages/auth/ResetPassword.jsx";

import Me from "../pages/account/Me.jsx";
import EditProduct from "../pages/account/EditProduct.jsx";
import DashboardProdutos from "../pages/dashboard/DashboardProdutos.jsx";
import EditarProduto from "../pages/dashboard/EditarProduto.jsx";

export default function AppRoutes({ isInitializingSession = false }) {
  return (
    <Routes>
      {/* Home SEMPRE pública (nunca redireciona para /login automaticamente) */}
      <Route path="/" element={<Home isInitializingSession={isInitializingSession} />} />

      {/* Público (auth) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/activate" element={<Activate />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Privado (e-commerce / conta) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/account" element={<Me />} />
        <Route path="/account/edit-product/:id" element={<EditProduct />} />
        <Route path="/cart" element={<ComingSoon title="Carrinho" />} />
        <Route path="/checkout" element={<ComingSoon title="Checkout" />} />
        <Route path="/orders" element={<ComingSoon title="Pedidos" />} />
        <Route path="/addresses" element={<ComingSoon title="Endereços" />} />
        <Route path="/sales" element={<ComingSoon title="Minhas vendas" />} />
        <Route path="/settings" element={<ComingSoon title="Configurações" />} />
        <Route path="/help" element={<ComingSoon title="Ajuda" />} />

        {/* Dashboard de produtos */}
        <Route path="/dashboard/produtos" element={<DashboardProdutos />} />
        <Route path="/dashboard/produtos/editar/:id" element={<EditarProduto />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

