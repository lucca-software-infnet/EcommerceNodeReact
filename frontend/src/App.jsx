import { useEffect, useMemo, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes.jsx";
import Header from "./components/Header.jsx";
import { useAuth } from "./contexts/AuthContext.jsx";

export default function App() {
  const headerRef = useRef(null);
  const location = useLocation();
  const { isInitializing } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const isHome = location.pathname === "/";
  const query = useMemo(() => (isHome ? searchParams.get("q") || "" : ""), [isHome, searchParams]);

  const onSearch = useMemo(() => {
    if (!isHome) return undefined;
    return (next) => {
      const value = String(next ?? "");
      if (!value.trim()) setSearchParams({}, { replace: true });
      else setSearchParams({ q: value }, { replace: true });
    };
  }, [isHome, setSearchParams]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return undefined;

    const setVar = () => {
      const h = el.getBoundingClientRect().height || 0;
      document.documentElement.style.setProperty("--appHeaderHeight", `${h}px`);
    };

    setVar();
    const ro = new ResizeObserver(() => setVar());
    ro.observe(el);
    window.addEventListener("resize", setVar);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", setVar);
    };
  }, []);

  return (
    <>
      <div ref={headerRef}>
        <Header onSearch={onSearch} initialQuery={query} isInitializingSession={isInitializing} />
      </div>
      <AppRoutes />
    </>
  );
}
