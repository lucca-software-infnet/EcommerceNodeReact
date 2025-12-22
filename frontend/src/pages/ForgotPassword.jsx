import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setMsg("");
    setLoading(true);
    try {
      const res = await api.post("/auth/password/forgot", { email });
      setMsg(res.data?.msg || "Se o e-mail existir, enviaremos um link.");
    } catch (err) {
      setErro(err?.response?.data?.erro || "Falha ao solicitar redefinição");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h1>Esqueci minha senha</h1>
      <form onSubmit={handleSubmit}>
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

        {erro ? <p style={{ color: "crimson" }}>{erro}</p> : null}
        {msg ? <p style={{ color: "green" }}>{msg}</p> : null}

        <button type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Enviando..." : "Enviar link"}
        </button>
      </form>

      <p style={{ marginTop: 12 }}>
        <Link to="/login">Voltar ao login</Link>
      </p>
    </div>
  );
}

