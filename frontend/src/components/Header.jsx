import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { api } from "../api/client.js";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";
import HeaderCart from "./cart/HeaderCart.jsx";
import "./Header.css";

function getFullName(user) {
  const nome = (user?.nome || "").trim();
  const sobrenome = (user?.sobrenome || "").trim();
  const full = `${nome} ${sobrenome}`.trim();
  return full || user?.name || "Minha conta";
}

function getEmail(user) {
  return user?.email || "";
}

function getInitials(user) {
  const fullName = getFullName(user);
  const parts = fullName.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "U";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return `${first}${second}`.toUpperCase();
}

function svgAvatarDataUrl(initials) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3498db"/>
      <stop offset="1" stop-color="#2980b9"/>
    </linearGradient>
  </defs>
  <rect width="96" height="96" rx="48" fill="url(#g)"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
    font-family="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
    font-size="34" font-weight="700" fill="#ffffff">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function Header({ initialQuery = "", isInitializingSession = false }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebouncedValue(query, 250);

  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const blurTimerRef = useRef(null);

  useEffect(() => {
    // Mantém o input sincronizado com a URL atual (ex: /search?q=...)
    setQuery(initialQuery || "");
  }, [initialQuery]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const onMouseDown = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setIsMenuOpen(false);
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen]);

  const displayName = useMemo(() => getFullName(user), [user]);
  const email = useMemo(() => getEmail(user), [user]);
  const initials = useMemo(() => getInitials(user), [user]);
  const avatarUrl = user?.avatarUrl || user?.fotoUrl || user?.foto || svgAvatarDataUrl(initials);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = String(query || "").trim();
    setIsSuggestOpen(false);
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/");
  };

  useEffect(() => {
    let cancelled = false;
    const q = String(debouncedQuery || "").trim();

    async function run() {
      if (!isSuggestOpen) return;
      if (!q) {
        setSuggestions([]);
        return;
      }

      setIsSuggestLoading(true);
      try {
        const res = await api.get("/produtos/sugestoes", { params: { q, limit: 10 } });
        if (cancelled) return;
        const data = Array.isArray(res?.data?.data) ? res.data.data : [];
        setSuggestions(data.slice(0, 10));
      } catch {
        if (cancelled) return;
        setSuggestions([]);
      } finally {
        if (!cancelled) setIsSuggestLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, isSuggestOpen]);

  const go = (path) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="shop-header">
      <div className="shop-header__inner">
        <Link to="/" className="shop-header__logo" aria-label="Ir para a Home">
          <span className="shop-header__logoMark">ML</span>
          <span className="shop-header__logoText">Marketplace</span>
        </Link>

        <form className="shop-header__search" onSubmit={handleSubmit} role="search">
          <input
            value={query}
            onChange={(e) => {
              const next = e.target.value;
              setQuery(next);

              const trimmed = String(next || "").trim();
              if (!trimmed) {
                setIsSuggestOpen(false);
                setSuggestions([]);
              } else {
                setIsSuggestOpen(true);
              }
            }}
            onFocus={() => {
              if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
              const trimmed = String(query || "").trim();
              if (trimmed) setIsSuggestOpen(true);
            }}
            onBlur={() => {
              // Pequeno delay para permitir clique nas sugestões sem "piscar"
              blurTimerRef.current = setTimeout(() => {
                setIsSuggestOpen(false);
              }, 120);
            }}
            className="shop-header__searchInput"
            placeholder="Buscar produtos, marcas e categorias..."
            aria-label="Buscar"
          />
          <button className="shop-header__searchBtn" type="submit" aria-label="Buscar">
            <svg
              className="shop-header__searchIcon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M16.6 16.6 21 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="shop-header__srOnly">Buscar</span>
          </button>

          {isSuggestOpen && String(query || "").trim() ? (
            <div className="shop-header__suggest" role="listbox" aria-label="Sugestões de busca">
              {isSuggestLoading ? (
                <div className="shop-header__suggestEmpty">Buscando...</div>
              ) : suggestions.length ? (
                suggestions.slice(0, 10).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="shop-header__suggestItem"
                    role="option"
                    onMouseDown={(ev) => {
                      // evita o blur do input antes do click
                      ev.preventDefault();
                    }}
                    onClick={() => {
                      const next = String(s?.descricao || "").trim();
                      setQuery(next);
                      setIsSuggestOpen(false);
                      navigate(next ? `/search?q=${encodeURIComponent(next)}` : "/");
                    }}
                    title={s?.descricao}
                  >
                    <span className="shop-header__suggestText">{s?.descricao}</span>
                  </button>
                ))
              ) : (
                <div className="shop-header__suggestEmpty">Nenhuma sugestão.</div>
              )}
            </div>
          ) : null}
        </form>

        <div className="shop-header__right" ref={menuRef}>
          {!isAuthenticated ? (
            <>
              <HeaderCart />
              <Link to="/login" className="shop-header__loginBtn">
                Logar
              </Link>
            </>
          ) : (
            <>
              <HeaderCart />
              <button
                type="button"
                className="shop-header__avatarBtn"
                onClick={() => setIsMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                aria-label="Abrir menu do usuário"
                disabled={isInitializingSession}
              >
                <img className="shop-header__avatarImg" src={avatarUrl} alt={displayName} />
              </button>

              {isMenuOpen ? (
                <div className="user-menu" role="menu">
                  <div className="user-menu__top">
                    <img className="user-menu__avatar" src={avatarUrl} alt={displayName} />
                    <div className="user-menu__name">{displayName}</div>
                    <div className="user-menu__email">{email}</div>
                  </div>

                  <div className="user-menu__divider" />

                  <div className="user-menu__item" role="menuitem" tabIndex={0} onClick={() => go("/account")}>
                    Minha conta
                  </div>
                  <div
                    className="user-menu__item"
                    role="menuitem"
                    tabIndex={0}
                    onClick={() => go("/orders")}
                  >
                    Minhas compras
                  </div>
                  <div className="user-menu__item" role="menuitem" tabIndex={0} onClick={() => go("/sales")}>
                    Minhas vendas
                  </div>
                  <div
                    className="user-menu__item"
                    role="menuitem"
                    tabIndex={0}
                    onClick={() => go("/settings")}
                  >
                    Configurações
                  </div>
                  <div className="user-menu__item" role="menuitem" tabIndex={0} onClick={() => go("/help")}>
                    Ajuda
                  </div>
                  <div className="user-menu__item user-menu__item--danger" role="menuitem" tabIndex={0} onClick={logout}>
                    Sair
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

