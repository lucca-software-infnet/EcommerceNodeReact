import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";

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
      const res = await api.post("/auth/password/reset", { token, senha });
      setMsg(res.data?.msg || "Senha atualizada com sucesso.");
    } catch (err) {
      setErro(err?.response?.data?.erro || "Falha ao redefinir senha");
    } finally {
      setLoading(false);
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
              style={{ display: "block", width: "100%", margin: "6px 0 12px" }}
            />
          </label>

          {erro ? <p style={{ color: "crimson" }}>{erro}</p> : null}
          {msg ? <p style={{ color: "green" }}>{msg}</p> : null}

          <button type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Salvando..." : "Atualizar senha"}
          </button>
        </form>
      )}

      <p style={{ marginTop: 12 }}>
        <Link to="/login">Voltar ao login</Link>
      </p>
    </div>
  );
}

