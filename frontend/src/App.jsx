import { Navigate, Route, Routes } from "react-router-dom";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Me from "./pages/Me.jsx";
import Activate from "./pages/Activate.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/activate" element={<Activate />} />
      <Route path="/me" element={<Me />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
