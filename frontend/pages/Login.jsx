import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../src/api/client.js";

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
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            placeholder="Digite seu e-mail"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", width: "100%", margin: "6px 0 12px" }}
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            placeholder="Digite sua senha"
            value={senha}
            required
            onChange={(e) => setSenha(e.target.value)}
            style={{ display: "block", width: "100%", margin: "6px 0 12px" }}
          />
        </label>

        {erro ? <p style={{ color: "crimson" }}>{erro}</p> : null}

        <button type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p style={{ marginTop: 12 }}>
        <Link to="/forgot-password">Esqueci minha senha</Link>
      </p>

      <p style={{ marginTop: 12 }}>
        Não tem conta? <Link to="/register">Cadastre-se</Link>
      </p>
    </div>
  );
}