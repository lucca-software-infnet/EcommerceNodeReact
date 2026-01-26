import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import ProductCard from "../components/home/ProductCard.jsx";
import "./SearchResults.css";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const rawQuery = searchParams.get("q") || "";
  const query = useMemo(() => rawQuery.trim(), [rawQuery]);

  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    if (!query) {
      setResults([]);
      setError("");
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    const loadResults = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get("/produtos/busca", {
          params: { q: query, limit: 24 }
        });

        if (!isActive) return;

        const data = response?.data?.data;
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!isActive) return;
        setError("Nao foi possivel carregar a busca.");
        setResults([]);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadResults();

    return () => {
      isActive = false;
    };
  }, [query]);

  const hasQuery = query.length > 0;

  return (
    <div className="search-results">
      <main className="search-results__main">
        <header className="search-results__header">
          <div>
            <h1 className="search-results__title">
              {hasQuery ? `Resultados para "${query}"` : "Resultados da busca"}
            </h1>
            <p className="search-results__subtitle">
              {hasQuery ? `${results.length} produto(s) encontrados` : "Digite um termo para buscar produtos."}
            </p>
          </div>
        </header>

        {!hasQuery ? (
          <div className="search-results__empty">Digite um termo para buscar produtos.</div>
        ) : null}

        {hasQuery && isLoading ? (
          <div className="search-results__empty">Carregando resultados...</div>
        ) : null}

        {hasQuery && !isLoading && error ? (
          <div className="search-results__empty">{error}</div>
        ) : null}

        {hasQuery && !isLoading && !error && results.length === 0 ? (
          <div className="search-results__empty">Nenhum produto encontrado.</div>
        ) : null}

        {hasQuery && !isLoading && !error && results.length > 0 ? (
          <div className="search-results__grid">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
}
