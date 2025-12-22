import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../src/api/client.js";
import "../src/styles/ForgotRegister.css";

export default function Register() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      await api.post("/auth/register", { nome, email, senha });
      navigate("/login");
    } catch (err) {
      setErro(err?.response?.data?.erro || "Falha no cadastro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <h1>Cadastrar</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome</label>
            <input
              type="text"
              placeholder="Digite seu nome"
              value={nome}
              required
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

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
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>

        <div className="page-footer">
          <p>
            Já tem conta? <Link to="/login">Faça login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
