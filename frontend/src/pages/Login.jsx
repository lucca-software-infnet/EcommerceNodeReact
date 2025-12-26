import { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext.js";
import "../styles/Login.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isBusy } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const redirectTo = useMemo(() => {
    const from = location?.state?.from;
    if (from?.pathname) return from.pathname + (from.search || "");
    return "/me";
  }, [location]);

  if (isAuthenticated) {
    return <Navigate to="/me" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    try {
      await login({ email, senha });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setErro(err?.message || "Falha no login");
    }
  };

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
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              required
              autoComplete="current-password"
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          {erro && <p className="error-message">{erro}</p>}

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

