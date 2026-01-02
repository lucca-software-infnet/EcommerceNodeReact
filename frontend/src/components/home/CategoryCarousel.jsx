import { useMemo, useRef, useState } from "react";
import ProductCard from "./ProductCard.jsx";
import "./CategoryCarousel.css";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function CategoryCarousel({ title, categories = [], products = [] }) {
  const [activeCategory, setActiveCategory] = useState(categories?.[0]?.id || "");
  const listRef = useRef(null);

  const filtered = useMemo(() => {
    const cat = activeCategory || categories?.[0]?.id;
    if (!cat) return products;
    return products.filter((p) => p.category === cat);
  }, [activeCategory, categories, products]);

  const scrollByCards = (dir) => {
    if (!listRef.current) return;
    const el = listRef.current;
    const amount = clamp(el.clientWidth * 0.85, 220, 720);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <section className="cshelf" aria-label={title}>
      <div className="cshelf__head">
        <h2 className="cshelf__title">{title}</h2>
        <div className="cshelf__nav">
          <button type="button" className="cshelf__navBtn" onClick={() => scrollByCards(-1)} aria-label="Voltar">
            ‹
          </button>
          <button type="button" className="cshelf__navBtn" onClick={() => scrollByCards(1)} aria-label="Avançar">
            ›
          </button>
        </div>
      </div>

      <div className="cshelf__tabs" role="tablist" aria-label="Categorias">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`cshelf__tab ${c.id === activeCategory ? "is-active" : ""}`}
            onClick={() => setActiveCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="cshelf__track" ref={listRef}>
        {filtered.map((p) => (
          <div key={p.id} className="cshelf__item">
            <ProductCard product={p} variant="compact" />
          </div>
        ))}
      </div>
    </section>
  );
}

