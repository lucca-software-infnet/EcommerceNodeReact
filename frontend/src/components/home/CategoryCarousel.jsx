import { useEffect, useMemo, useRef, useState } from "react";
import ProductCard from "./ProductCard.jsx";

export default function CategoryCarousel({ products = [] }) {
  const categories = useMemo(() => {
    const set = new Set();
    for (const p of products) {
      if (p?.category) set.add(p.category);
    }
    return Array.from(set);
  }, [products]);

  const [activeCategory, setActiveCategory] = useState("");
  const listRef = useRef(null);

  const resolvedActiveCategory = useMemo(() => {
    if (!categories.length) return "";
    if (activeCategory && categories.includes(activeCategory)) return activeCategory;
    return categories[0];
  }, [activeCategory, categories]);

  useEffect(() => {
    listRef.current?.scrollTo?.({ left: 0, behavior: "smooth" });
  }, [resolvedActiveCategory]);

  const visible = useMemo(() => {
    if (!resolvedActiveCategory) return [];
    return products.filter((p) => p?.category === resolvedActiveCategory).slice(0, 12);
  }, [products, resolvedActiveCategory]);

  const scrollBy = (dir) => {
    listRef.current?.scrollBy?.({ left: dir * 520, behavior: "smooth" });
  };

  return (
    <section className="category-carousel" aria-label="Produtos por categoria">
      <div className="category-carousel__head">
        <h2 className="home-section__title">Categorias</h2>
        <div className="category-carousel__tabs" role="tablist" aria-label="Categorias">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              className={c === resolvedActiveCategory ? "cat-tab cat-tab--active" : "cat-tab"}
              aria-selected={c === resolvedActiveCategory ? "true" : "false"}
              onClick={() => setActiveCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="category-carousel__body">
        <button
          type="button"
          className="strip-nav"
          aria-label="Rolar para esquerda"
          onClick={() => scrollBy(-1)}
        >
          ‹
        </button>

        <div className="product-strip" ref={listRef}>
          {visible.map((p) => (
            <div className="product-strip__item" key={p.id}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>

        <button
          type="button"
          className="strip-nav"
          aria-label="Rolar para direita"
          onClick={() => scrollBy(1)}
        >
          ›
        </button>
      </div>
    </section>
  );
}

