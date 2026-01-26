import { useEffect, useState } from "react";
import HeroCarousel from "../components/home/HeroCarousel.jsx";
import CategoryCarousel from "../components/home/CategoryCarousel.jsx";
import ProductCard from "../components/home/ProductCard.jsx";
import { HERO_SLIDES } from "../components/home/mockCatalog.js";
import { api } from "../api/client.js";
import "./Home.css";

export default function Home() {
  const [randomProducts, setRandomProducts] = useState([]);
  const [categoryItems, setCategoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadHome = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [randomRes, categoryRes] = await Promise.all([
          api.get("/produtos/random", { params: { limit: 16 } }),
          api.get("/produtos/random-por-categoria")
        ]);

        if (!isActive) return;

        const randomData = randomRes?.data?.data;
        const categoryData = categoryRes?.data?.data;

        setRandomProducts(Array.isArray(randomData) ? randomData : []);
        setCategoryItems(Array.isArray(categoryData) ? categoryData : []);
      } catch (err) {
        if (!isActive) return;
        setError("Nao foi possivel carregar os produtos.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadHome();

    return () => {
      isActive = false;
    };
  }, []);

  const first = randomProducts.slice(0, 8);
  const second = randomProducts.slice(8, 16);

  return (
    <div className="home">
      <main className="home__main">
        {/* 1) Carousel grande (hero) */}
        <HeroCarousel slides={HERO_SLIDES} />

        {/* 2) Duas linhas horizontais (4 cards cada) */}
        <section className="home-section" aria-label="Ofertas em destaque">
          <div className="home-section__head">
            <h2 className="home-section__title">Destaques para você</h2>
            <div className="home-section__count">{randomProducts.length} itens</div>
          </div>

          {error ? <div className="home-section__count">{error}</div> : null}
          {!error && !isLoading && randomProducts.length === 0 ? (
            <div className="home-section__count">Nenhum produto disponivel.</div>
          ) : null}

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
        <CategoryCarousel items={categoryItems} />

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

