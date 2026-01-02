import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";

export default function Activate() {
  const { activate } = useAuth();
  const [params] = useSearchParams();
  const token = params.get("token");

  const calledRef = useRef(false);

  const [status, setStatus] = useState(
    token ? "loading" : "error"
  );
  const [message, setMessage] = useState(
    token ? "Ativando conta..." : "Token não informado"
  );

  useEffect(() => {
    if (!token) return;
    if (calledRef.current) return;

    calledRef.current = true;

    activate(token)
      .then((res) => {
        setStatus("success");
        setMessage(res?.msg || "Conta ativada com sucesso!");
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.erro ||
          "Token inválido ou expirado";
        setStatus("error");
        setMessage(msg);
      });
  }, [token, activate]);

  return (
    <div style={{ maxWidth: 520, margin: "40px auto" }}>
      <h1>Ativação</h1>

      {status === "loading" && (
        <p style={{ color: "#555" }}>{message}</p>
      )}

      {status === "success" && (
        <p style={{ color: "green" }}>{message}</p>
      )}

      {status === "error" && (
        <p style={{ color: "crimson" }}>{message}</p>
      )}

      <Link to="/login">Ir para login</Link>
    </div>
  );
}
