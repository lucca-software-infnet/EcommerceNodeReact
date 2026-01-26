import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import ProductCard from "../components/home/ProductCard.jsx";
import { toCatalogProduct } from "../utils/productAdapter.js";
import "./Search.css";

export default function Search() {
  const [searchParams] = useSearchParams();
  const q = (searchParams.get("q") || "").trim();

  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!q) {
        setItems([]);
        setCount(0);
        return;
      }

      setIsLoading(true);
      try {
        const res = await api.get("/produtos/search", {
          params: { q, page: 1, limit: 24 },
        });

        if (cancelled) return;
        const data = Array.isArray(res?.data?.data) ? res.data.data : [];
        const mapped = data.map(toCatalogProduct).filter(Boolean);
        setItems(mapped);
        setCount(Number(res?.data?.metadata?.total ?? mapped.length));
      } catch {
        if (cancelled) return;
        setItems([]);
        setCount(0);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [q]);

  const title = useMemo(() => {
    if (!q) return "Resultados";
    return `Resultados para “${q}”`;
  }, [q]);

  return (
    <div className="search">
      <main className="search__main">
        <section className="search-section" aria-label="Resultados de busca">
          <div className="search-section__head">
            <h2 className="search-section__title">{title}</h2>
            <div className="search-section__meta">
              {isLoading ? "Buscando..." : q ? `${count} itens` : "Digite para buscar"}
            </div>
          </div>

          {q && !isLoading && items.length === 0 ? (
            <div className="search-empty">Nenhum produto encontrado.</div>
          ) : null}

          <div className="search-grid" aria-busy={isLoading ? "true" : "false"}>
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

