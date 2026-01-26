import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../contexts/AuthContext.jsx";
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

export default function Header({ onSearch, initialQuery = "", isInitializingSession = false }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const suggestionRequestId = useRef(0);

  useEffect(() => {
    setQuery(initialQuery);
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

  useEffect(() => {
    const term = query.trim();
    if (!isSearchFocused || !term) {
      setSuggestions([]);
      return;
    }

    const requestId = ++suggestionRequestId.current;
    const timer = setTimeout(async () => {
      try {
        const response = await api.get("/produtos/sugestoes", {
          params: { q: term, limit: 10 }
        });
        if (suggestionRequestId.current !== requestId) return;
        const data = response?.data?.data;
        setSuggestions(Array.isArray(data) ? data.slice(0, 10) : []);
      } catch (error) {
        if (suggestionRequestId.current === requestId) {
          setSuggestions([]);
        }
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [query, isSearchFocused]);

  const runSearch = (term) => {
    const q = String(term || "").trim();
    setSuggestions([]);
    setIsSearchFocused(false);
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runSearch(query);
  };

  const go = (path) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  const showSuggestions = isSearchFocused && query.trim().length > 0 && suggestions.length > 0;

  return (
    <header className="shop-header">
      <div className="shop-header__inner">
        <Link to="/" className="shop-header__logo" aria-label="Ir para a Home">
          <span className="shop-header__logoMark">ML</span>
          <span className="shop-header__logoText">Marketplace</span>
        </Link>

        <form className="shop-header__search" onSubmit={handleSubmit} role="search">
          <div className="shop-header__searchField">
            <input
              value={query}
              onChange={(e) => {
                const next = e.target.value;
                setQuery(next);
                if (typeof onSearch === "function") onSearch(next);
              }}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="shop-header__searchInput"
              placeholder="Buscar produtos, marcas e categorias..."
              aria-label="Buscar"
            />
            {showSuggestions ? (
              <div className="search-suggestions" role="listbox" aria-label="Sugestões de produtos">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    className="search-suggestions__item"
                    role="option"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setQuery(suggestion.descricao || "");
                      runSearch(suggestion.descricao);
                    }}
                  >
                    {suggestion.descricao}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
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
        </form>

        <div className="shop-header__right" ref={menuRef}>
          {!isAuthenticated ? (
            <Link to="/login" className="shop-header__loginBtn">
              Logar
            </Link>
          ) : (
            <>
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

