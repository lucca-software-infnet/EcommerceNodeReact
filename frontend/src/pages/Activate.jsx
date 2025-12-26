import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/authContext.js";

export default function Activate() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const { activate, isBusy } = useAuth();
  const [msg, setMsg] = useState(token ? "Ativando..." : "");
  const [erro, setErro] = useState(token ? "" : "Token não informado");

  useEffect(() => {
    let cancelled = false;
    if (!token) return;
    activate({ token })
      .then(() => {
        if (!cancelled) setMsg("Conta ativada com sucesso!");
      })
      .catch((err) => {
        if (!cancelled) {
          setErro(err?.message || "Falha ao ativar conta");
          setMsg("");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activate, token]);

  return (
    <div style={{ maxWidth: 520, margin: "40px auto" }}>
      <h1>Ativação</h1>
      {msg ? <p style={{ color: "green" }}>{msg}</p> : null}
      {erro ? <p style={{ color: "crimson" }}>{erro}</p> : null}
      {isBusy ? <p>Aguarde...</p> : null}
      <Link to="/login">Ir para login</Link>
    </div>
  );
}

