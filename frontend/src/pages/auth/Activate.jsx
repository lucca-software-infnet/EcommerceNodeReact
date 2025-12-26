import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";

export default function Activate() {
  const { activate, lastError } = useAuth();
  const [params] = useSearchParams();
  const token = params.get("token");
  const [msg, setMsg] = useState(token ? "Ativando..." : "");
  const [erro, setErro] = useState(token ? "" : "Token não informado");

  useEffect(() => {
    if (!token) return;
    activate(token)
      .then((res) => setMsg(res?.msg || "Conta ativada com sucesso!"))
      .catch(() => {
        setErro(lastError || "Falha ao ativar conta");
        setMsg("");
      });
  }, [token, activate, lastError]);

  return (
    <div style={{ maxWidth: 520, margin: "40px auto" }}>
      <h1>Ativação</h1>
      {msg ? <p style={{ color: "green" }}>{msg}</p> : null}
      {erro ? <p style={{ color: "crimson" }}>{erro}</p> : null}
      <Link to="/login">Ir para login</Link>
    </div>
  );
}

