import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";

export default function ResetPassword() {
  const { resetPassword, isBusy, lastError } = useAuth();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setMsg("");
    try {
      const res = await resetPassword({ token, senha });
      setMsg(res?.msg || "Senha atualizada com sucesso.");
    } catch {
      setErro(lastError || "Falha ao redefinir senha");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h1>Redefinir senha</h1>
      {!token ? (
        <>
          <p style={{ color: "crimson" }}>Token não informado.</p>
          <Link to="/forgot-password">Solicitar novo link</Link>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <label>
            Nova senha
            <input
              type="password"
              value={senha}
              required
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="new-password"
              style={{ display: "block", width: "100%", margin: "6px 0 12px" }}
            />
          </label>

          {erro ? <p style={{ color: "crimson" }}>{erro}</p> : null}
          {msg ? <p style={{ color: "green" }}>{msg}</p> : null}

          <button type="submit" disabled={isBusy} style={{ width: "100%" }}>
            {isBusy ? "Salvando..." : "Atualizar senha"}
          </button>
        </form>
      )}

      <p style={{ marginTop: 12 }}>
        <Link to="/login">Voltar ao login</Link>
      </p>
    </div>
  );
}

