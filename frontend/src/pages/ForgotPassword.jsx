import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/authContext.js";
import "../styles/ForgotPassword.css";

export default function ForgotPassword() {
  const { forgotPassword, isBusy } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [erro, setErro] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setMessage("");
    try {
      await forgotPassword({ email });
      setMessage("Email enviado com sucesso! Verifique sua caixa de entrada.");
    } catch (err) {
      setErro(err?.message || "Falha ao enviar email");
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
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {erro && <p className="forgot-error">{erro}</p>}
          {message && <p className="forgot-success">{message}</p>}

          <button type="submit" className="forgot-button" disabled={isBusy}>
            {isBusy ? "Enviando..." : "Enviar email"}
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
