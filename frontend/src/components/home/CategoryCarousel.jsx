import { useMemo, useRef, useState } from "react";

export default function CategoryCarousel({ categories }) {
  const scrollerRef = useRef(null);
  const [activeId, setActiveId] = useState(categories?.[0]?.id || "");

  const items = useMemo(() => categories || [], [categories]);

  const scrollBy = (delta) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section className="home-section">
      <div className="home-section__head">
        <h2 className="home-section__title">Por categoria</h2>
        <div className="home-section__controls">
          <button className="carousel-btn" type="button" onClick={() => scrollBy(-420)} aria-label="Anterior">
            ‹
          </button>
          <button className="carousel-btn" type="button" onClick={() => scrollBy(420)} aria-label="Próximo">
            ›
          </button>
        </div>
      </div>

      <div className="category-carousel" ref={scrollerRef}>
        {items.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`category-card ${c.id === activeId ? "category-card--active" : ""}`}
            onClick={() => setActiveId(c.id)}
          >
            <div className="category-card__name">{c.name}</div>
            <div className="category-card__hint">Ver produtos</div>
          </button>
        ))}
      </div>
    </section>
  );
}

