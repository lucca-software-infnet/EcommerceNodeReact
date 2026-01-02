import { useMemo, useState } from "react";
import Header from "../components/Header.jsx";
import CategoryCarousel from "../components/home/CategoryCarousel.jsx";
import HeroCarousel from "../components/home/HeroCarousel.jsx";
import ProductRow from "../components/home/ProductRow.jsx";
import { CATEGORIES, PRODUCTS, withImages } from "../components/home/mockCatalog.js";
import "./Home.css";

export default function Home({ isInitializingSession = false }) {
  const [query, setQuery] = useState("");

  const catalog = useMemo(() => withImages(PRODUCTS), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    const hits = catalog.filter((p) => p.name.toLowerCase().includes(q));
    // Mantém o layout fixo da Home (linhas 4x4) mesmo com busca muito restrita.
    return hits.length >= 16 ? hits : catalog;
  }, [catalog, query]);

  const topRows = useMemo(
    () => ({
      r1: filtered.slice(0, 4),
      r2: filtered.slice(4, 8),
    }),
    [filtered]
  );

  const bottomRows = useMemo(
    () => ({
      r1: filtered.slice(8, 12),
      r2: filtered.slice(12, 16),
    }),
    [filtered]
  );

  return (
    <div className="home">
      <Header onSearch={setQuery} initialQuery={query} isInitializingSession={isInitializingSession} />

      <main className="home__main">
        {/* 1) Carousel grande (hero) */}
        <HeroCarousel />

        {/* 2) Duas linhas (4 cards cada) */}
        <ProductRow title="Destaques de hoje" products={topRows.r1} />
        <ProductRow title="Você também pode gostar" products={topRows.r2} />

        {/* 3) Carousel menor por categoria */}
        <CategoryCarousel categories={CATEGORIES} />

        {/* 4) Mais duas linhas (4 cards cada) */}
        <ProductRow title="Mais vendidos" products={bottomRows.r1} />
        <ProductRow title="Recomendados para você" products={bottomRows.r2} />
      </main>
    </div>
  );
}

