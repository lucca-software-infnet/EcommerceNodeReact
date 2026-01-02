import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import Header from "../../components/Header.jsx";
import "./Account.css";

function getFullName(user) {
  const nome = (user?.nome || "").trim();
  const sobrenome = (user?.sobrenome || "").trim();
  return `${nome} ${sobrenome}`.trim() || user?.name || "Minha conta";
}

function getInitials(user) {
  const full = getFullName(user);
  const parts = full.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "U";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return `${first}${second}`.toUpperCase();
}

function svgAvatarDataUrl(initials) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3498db"/>
      <stop offset="1" stop-color="#2980b9"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="60" fill="url(#g)"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
    font-family="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
    font-size="42" font-weight="800" fill="#ffffff">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function Me() {
  const { user, logout, isInitializing } = useAuth();

  const name = getFullName(user);
  const email = user?.email || "";
  const avatarUrl =
    user?.avatarUrl ||
    user?.fotoUrl ||
    user?.foto ||
    user?.imagem ||
    svgAvatarDataUrl(getInitials(user));

  return (
    <div className="account">
      <Header />

      <main className="account__main">
        {isInitializing ? (
          <div className="account-card">
            <p>Carregando sessão...</p>
          </div>
        ) : null}

        {!isInitializing && !user ? (
          <div className="account-card">
            <p style={{ color: "crimson", fontWeight: 800, margin: 0 }}>Você não está logado.</p>
            <p style={{ margin: "10px 0 0" }}>
              <Link to="/login">Ir para login</Link>
            </p>
          </div>
        ) : null}

        {user ? (
          <div className="account__grid">
            <section className="account-card" aria-label="Perfil">
              <div className="account-card__header">
                <img className="account-card__avatar" src={avatarUrl} alt={name} />
                <div className="account-card__name">{name}</div>
                <div className="account-card__email">{email}</div>
              </div>

              <div className="account-danger">
                <button type="button" className="account-danger__btn" onClick={logout}>
                  Sair
                </button>
              </div>
            </section>

            <section className="account-links" aria-label="Atalhos da conta">
              <h2 className="account-links__title">Minha conta</h2>

              <Link className="account-link" to="/orders">
                Minhas compras <span className="account-link__chev">›</span>
              </Link>
              <Link className="account-link" to="/sales">
                Minhas vendas <span className="account-link__chev">›</span>
              </Link>
              <Link className="account-link" to="/settings">
                Configurações <span className="account-link__chev">›</span>
              </Link>
              <Link className="account-link" to="/help">
                Ajuda <span className="account-link__chev">›</span>
              </Link>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}

