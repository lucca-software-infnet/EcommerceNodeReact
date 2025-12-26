import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";

export default function Me() {
  const { user, logout, isInitializing } = useAuth();

  return (
    <div style={{ maxWidth: 520, margin: "40px auto" }}>
      <h1>Minha conta</h1>
      {isInitializing ? <p>Carregando...</p> : null}

      {!isInitializing && !user ? (
        <>
          <p style={{ color: "crimson" }}>Não autenticado</p>
          <Link to="/login">Ir para login</Link>
        </>
      ) : null}

      {user ? (
        <pre style={{ background: "#111", color: "#eee", padding: 12 }}>
          {JSON.stringify(user, null, 2)}
        </pre>
      ) : null}

      <button onClick={logout}>Sair</button>
    </div>
  );
}

