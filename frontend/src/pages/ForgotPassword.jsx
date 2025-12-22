import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import "../styles/ForgotPassword.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setMessage("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setMessage("Email enviado com sucesso! Verifique sua caixa de entrada.");
    } catch (err) {
      setErro(err?.response?.data?.erro || "Falha ao enviar email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-wrapper">
      <div className="forgot-container">
        <h1>Esqueci minha senha</h1>
        <p>Digite seu e-mail para receber instruções de redefinição</p>
        <form onSubmit={handleSubmit}>
          <div className="forgot-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {erro && <p className="forgot-error">{erro}</p>}
          {message && <p className="forgot-success">{message}</p>}

          <button type="submit" className="forgot-button" disabled={loading}>
            {loading ? "Enviando..." : "Enviar email"}
          </button>
        </form>

        <div className="forgot-footer">
          <p>
            <Link to="/login">Voltar ao login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
