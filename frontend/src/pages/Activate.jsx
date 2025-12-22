import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";

export default function Activate() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [msg, setMsg] = useState("Ativando...");
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!token) {
      setErro("Token não informado");
      setMsg("");
      return;
    }
    api
      .get("/auth/activate", { params: { token } })
      .then(() => setMsg("Conta ativada com sucesso!"))
      .catch((err) => {
        setErro(err?.response?.data?.erro || "Falha ao ativar conta");
        setMsg("");
      });
  }, [token]);

  return (
    <div style={{ maxWidth: 520, margin: "40px auto" }}>
      <h1>Ativação</h1>
      {msg ? <p style={{ color: "green" }}>{msg}</p> : null}
      {erro ? <p style={{ color: "crimson" }}>{erro}</p> : null}
      <Link to="/login">Ir para login</Link>
    </div>
  );
}

