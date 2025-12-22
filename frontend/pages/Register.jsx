import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../src/api/client.js";

export default function Register() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setMsg("");
    setLoading(true);
    try {
      await api.post("/auth/register", { nome, sobrenome, email, senha });
      setMsg("Cadastro criado. Verifique seu e-mail para ativar a conta.");
      setTimeout(() => navigate("/login"), 800);
    } catch (err) {
      setErro(err?.response?.data?.erro || "Falha no cadastro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h1>Criar conta</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Nome
          <input
            value={nome}
            required
            onChange={(e) => setNome(e.target.value)}
            style={{ display: "block", width: "100%", margin: "6px 0 12px" }}
          />
        </label>

        <label>
          Sobrenome
          <input
            value={sobrenome}
            onChange={(e) => setSobrenome(e.target.value)}
            style={{ display: "block", width: "100%", margin: "6px 0 12px" }}
          />
        </label>

        <label>
          Email
          <input
            type="email"
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
            value={senha}
            required
            onChange={(e) => setSenha(e.target.value)}
            style={{ display: "block", width: "100%", margin: "6px 0 12px" }}
          />
        </label>

        {erro ? <p style={{ color: "crimson" }}>{erro}</p> : null}
        {msg ? <p style={{ color: "green" }}>{msg}</p> : null}

        <button type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Criando..." : "Cadastrar"}
        </button>
      </form>

      <p style={{ marginTop: 12 }}>
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </div>
  );
}

