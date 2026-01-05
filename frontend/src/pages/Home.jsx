import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import HeroCarousel from "../components/home/HeroCarousel.jsx";
import CategoryCarousel from "../components/home/CategoryCarousel.jsx";
import ProductCard from "../components/home/ProductCard.jsx";
import { HERO_SLIDES, MOCK_PRODUCTS } from "../components/home/mockCatalog.js";
import "./Home.css";

export default function Home() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_PRODUCTS;
    return MOCK_PRODUCTS.filter((p) => p.name.toLowerCase().includes(q));
  }, [query]);

  const first = filtered.slice(0, 8);
  const second = filtered.slice(8, 16);

  return (
    <div className="home">
      <main className="home__main">
        {/* 1) Carousel grande (hero) */}
        <HeroCarousel slides={HERO_SLIDES} />

        {/* 2) Duas linhas horizontais (4 cards cada) */}
        <section className="home-section" aria-label="Ofertas em destaque">
          <div className="home-section__head">
            <h2 className="home-section__title">Destaques para você</h2>
            <div className="home-section__count">{filtered.length} itens</div>
          </div>

          <div className="home-rowGrid">
            {first.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="home-rowGrid">
            {first.slice(4, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* 3) Carousel menor por categoria */}
        <CategoryCarousel products={filtered} />

        {/* 4) Novamente duas linhas horizontais (4 cards cada) */}
        <section className="home-section" aria-label="Mais ofertas">
          <div className="home-section__head">
            <h2 className="home-section__title">Você também pode gostar</h2>
          </div>

          <div className="home-rowGrid">
            {second.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="home-rowGrid">
            {second.slice(4, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

