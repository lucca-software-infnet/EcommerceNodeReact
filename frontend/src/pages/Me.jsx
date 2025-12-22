import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Link, useNavigate } from "react-router-dom";

export default function Me() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .get("/users/me")
      .then((res) => {
        if (!cancelled) setMe(res.data);
      })
      .catch((err) => {
        if (!cancelled) setErro(err?.response?.data?.erro || "Não autenticado");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("accessToken");
      navigate("/login");
    }
  };

  if (erro) {
    return (
      <div style={{ maxWidth: 520, margin: "40px auto" }}>
        <h1>Minha conta</h1>
        <p style={{ color: "crimson" }}>{erro}</p>
        <Link to="/login">Ir para login</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: "40px auto" }}>
      <h1>Minha conta</h1>
      {!me ? (
        <p>Carregando...</p>
      ) : (
        <pre style={{ background: "#111", color: "#eee", padding: 12 }}>
          {JSON.stringify(me, null, 2)}
        </pre>
      )}

      <button onClick={logout}>Sair</button>
    </div>
  );
}

