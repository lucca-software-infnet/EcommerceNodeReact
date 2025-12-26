import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import "../../styles/ForgotRegister.css";

export default function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated, isBusy, lastError } = useAuth();

  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState("");
  const [erroLocal, setErroLocal] = useState("");

  useEffect(() => {
    if (isAuthenticated) navigate("/me", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroLocal("");
    setMsg("");
    try {
      const data = await register({ nome, sobrenome, email, senha });
      if (data?.activationRequired) {
        setMsg(
          data?.msg ||
            "Cadastro realizado. Verifique seu e-mail para ativar a conta antes de fazer login."
        );
        return;
      }
      navigate("/login", { replace: true });
    } catch {
      setErroLocal(lastError || "Falha no cadastro");
    }
  };

  const erro = erroLocal || lastError;

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
              autoComplete="given-name"
            />
          </div>

          <div className="form-group">
            <label>Sobrenome</label>
            <input
              type="text"
              placeholder="Digite seu sobrenome"
              value={sobrenome}
              onChange={(e) => setSobrenome(e.target.value)}
              autoComplete="family-name"
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
              autoComplete="new-password"
            />
          </div>

          {erro ? <p className="error-message">{erro}</p> : null}
          {msg ? <p style={{ color: "green" }}>{msg}</p> : null}

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

