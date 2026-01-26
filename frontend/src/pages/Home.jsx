import { useEffect, useMemo, useState } from "react";
import HeroCarousel from "../components/home/HeroCarousel.jsx";
import CategoryCarousel from "../components/home/CategoryCarousel.jsx";
import ProductCard from "../components/home/ProductCard.jsx";
import { HERO_SLIDES } from "../components/home/mockCatalog.js";
import { api } from "../api/client.js";
import { toCatalogProduct } from "../utils/productAdapter.js";
import "./Home.css";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categoryItems, setCategoryItems] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [randomRes, byDeptRes] = await Promise.all([
          api.get("/produtos/random", { params: { limit: 16 } }),
          api.get("/produtos/random-por-departamento"),
        ]);

        if (cancelled) return;

        const random = Array.isArray(randomRes?.data?.data) ? randomRes.data.data : [];
        setProducts(random.map(toCatalogProduct).filter(Boolean));

        const byDept = Array.isArray(byDeptRes?.data?.data) ? byDeptRes.data.data : [];
        setCategoryItems(
          byDept
            .map((item) => ({
              category: item?.departamento || "",
              product: toCatalogProduct(item?.produto),
            }))
            .filter((x) => x.category && x.product)
        );
      } catch {
        // Home deve ser resiliente: mantém vazio se API falhar.
        if (cancelled) return;
        setProducts([]);
        setCategoryItems([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const first = useMemo(() => products.slice(0, 8), [products]);
  const second = useMemo(() => products.slice(8, 16), [products]);

  return (
    <div className="home">
      <main className="home__main">
        {/* 1) Carousel grande (hero) */}
        <HeroCarousel slides={HERO_SLIDES} />

        {/* 2) Duas linhas horizontais (4 cards cada) */}
        <section className="home-section" aria-label="Ofertas em destaque">
          <div className="home-section__head">
            <h2 className="home-section__title">Destaques para você</h2>
            <div className="home-section__count">{products.length} itens</div>
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

