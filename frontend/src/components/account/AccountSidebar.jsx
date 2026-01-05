import "./AccountSidebar.css";

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
      <stop offset="0" stop-color="#60a5fa"/>
      <stop offset="1" stop-color="#2563eb"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="60" fill="url(#g)"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
    font-family="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
    font-size="42" font-weight="800" fill="#ffffff">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function AccountSidebar({ user, activeSection, onSelectSection, onLogout }) {
  const name = getFullName(user);
  const email = user?.email || "";
  const avatarUrl =
    user?.avatarUrl ||
    user?.fotoUrl ||
    user?.foto ||
    user?.imagem ||
    svgAvatarDataUrl(getInitials(user));

  const items = [
    { key: "account", label: "Minha Conta" },
    { key: "purchases", label: "Minhas Compras" },
    { key: "products", label: "Produtos" },
    { key: "sales", label: "Minhas Vendas" },
    { key: "settings", label: "Configurações" },
  ];

  const handleSelect = (key) => {
    if (typeof onSelectSection === "function") onSelectSection(key);
  };

  return (
    <div className="accountSidebar">
      <div className="accountSidebar__header" aria-label="Perfil">
        <img className="accountSidebar__avatar" src={avatarUrl} alt={name} />
        <div className="accountSidebar__who">
          <div className="accountSidebar__name" title={name}>
            {name}
          </div>
          {email ? (
            <div className="accountSidebar__email" title={email}>
              {email}
            </div>
          ) : null}
        </div>
      </div>

      <nav className="accountSidebar__nav" aria-label="Seções da conta">
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            className={`accountSidebar__item ${activeSection === it.key ? "accountSidebar__item--active" : ""}`}
            onClick={() => handleSelect(it.key)}
            aria-current={activeSection === it.key ? "page" : undefined}
          >
            <span className="accountSidebar__itemLabel">{it.label}</span>
            <span className="accountSidebar__itemChev">›</span>
          </button>
        ))}
      </nav>

      <div className="accountSidebar__footer">
        <button type="button" className="accountSidebar__logout" onClick={onLogout}>
          Sair
        </button>
      </div>
    </div>
  );
}

