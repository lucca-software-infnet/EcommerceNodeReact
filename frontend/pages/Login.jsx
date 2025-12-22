import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../src/api/client.js";
import "../src/styles/Login.css";


export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, senha });
      localStorage.setItem("accessToken", res.data.accessToken);
      navigate("/me");
    } catch (err) {
      setErro(err?.response?.data?.erro || "Falha no login");
    } finally {
      setLoading(false);
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
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          {erro && <p className="error-message">{erro}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
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
