import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext.js";
import "../styles/ForgotRegister.css";

export default function Register() {
  const navigate = useNavigate();
  const { register, isBusy } = useAuth();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setMsg("");
    try {
      await register({ nome, email, senha });
      setMsg("Cadastro realizado. Verifique seu e-mail para ativar a conta, se necessário.");
      // Deixa a mensagem aparecer e redireciona para login (UX simples).
      setTimeout(() => navigate("/login", { replace: true }), 600);
    } catch (err) {
      setErro(err?.message || "Falha no cadastro");
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
              autoComplete="name"
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
              autoComplete="new-password"
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          {erro && <p className="error-message">{erro}</p>}
          {msg && <p style={{ color: "green" }}>{msg}</p>}

          <button type="submit" disabled={isBusy}>
            {isBusy ? "Cadastrando..." : "Cadastrar"}
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

