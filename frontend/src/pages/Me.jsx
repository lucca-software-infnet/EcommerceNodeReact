import { Link } from "react-router-dom";
import { useAuth } from "../contexts/authContext.js";

export default function Me() {
  const { user, logout, isBusy, loadSession } = useAuth();

  return (
    <div style={{ maxWidth: 720, margin: "40px auto" }}>
      <h1>Minha conta</h1>
      {!user ? (
        <p>Carregando dados...</p>
      ) : (
        <pre style={{ background: "#111", color: "#eee", padding: 12 }}>
          {JSON.stringify(user, null, 2)}
        </pre>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <button onClick={() => loadSession()} disabled={isBusy}>
          {isBusy ? "Atualizando..." : "Atualizar sessão"}
        </button>
        <button onClick={logout} disabled={isBusy}>
          {isBusy ? "Saindo..." : "Sair"}
        </button>
      </div>

      <hr style={{ margin: "16px 0" }} />
      <h2 style={{ marginBottom: 8 }}>Áreas privadas (e-commerce)</h2>
      <ul style={{ display: "grid", gap: 6, paddingLeft: 18 }}>
        <li>
          <Link to="/cart">Carrinho</Link>
        </li>
        <li>
          <Link to="/checkout">Checkout</Link>
        </li>
        <li>
          <Link to="/orders">Pedidos</Link>
        </li>
        <li>
          <Link to="/addresses">Endereços</Link>
        </li>
      </ul>
    </div>
  );
}

