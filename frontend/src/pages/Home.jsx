import { useMemo, useState } from "react";
import Header from "../components/Header.jsx";
import HeroCarousel from "../components/home/HeroCarousel.jsx";
import ProductGridSection from "../components/home/ProductGridSection.jsx";
import CategoryCarousel from "../components/home/CategoryCarousel.jsx";
import { CATEGORIES, HERO_SLIDES, MOCK_PRODUCTS } from "./home/homeData.js";
import "./Home.css";

export default function Home({ isInitializingSession = false }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_PRODUCTS;
    return MOCK_PRODUCTS.filter((p) => p.name.toLowerCase().includes(q));
  }, [query]);

  // Mantém a estrutura obrigatória (sempre 2 linhas de 4) mesmo com busca.
  const pool = filtered.length >= 8 ? filtered : MOCK_PRODUCTS;
  const firstGrid = pool.slice(0, 8);
  const secondGrid = pool.slice(8, 16).length ? pool.slice(8, 16) : pool.slice(0, 8);

  return (
    <div className="home">
      <Header
        query={query}
        onQueryChange={setQuery}
        onSearch={(q) => setQuery(q)}
        isInitializingSession={isInitializingSession}
      />

      <main className="home__main">
        {/* 1) Carousel grande (hero) */}
        <HeroCarousel slides={HERO_SLIDES} />

        {/* 2) Duas linhas horizontais (4 cards por linha) */}
        <ProductGridSection title="Destaques para você" products={firstGrid} />

        {/* 3) Carousel menor por categoria */}
        <CategoryCarousel title="Produtos por categoria" categories={CATEGORIES} products={MOCK_PRODUCTS} />

        {/* 4) Novamente duas linhas horizontais (4 cards por linha) */}
        <ProductGridSection title="Recomendados do dia" products={secondGrid} />
      </main>
    </div>
  );
}

