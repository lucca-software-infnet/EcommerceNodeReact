import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import "../../styles/Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isBusy, lastError } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erroLocal, setErroLocal] = useState("");

  useEffect(() => {
    // Regras: após login bem-sucedido, sempre redireciona para "/"
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroLocal("");
    try {
      await login({ email, senha });
      navigate("/", { replace: true });
    } catch {
      setErroLocal(lastError || "Falha no login");
    }
  };

  const erro = erroLocal || lastError;

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              required
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {erro ? <p className="error-message">{erro}</p> : null}

          <button type="submit" disabled={isBusy}>
            {isBusy ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="login-footer">
          <p>
            <Link to="/forgot-password">Esqueci minha senha</Link>
          </p>
          <p>
            Não tem conta? <Link to="/register">Cadastre-se</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

