import { useRef } from "react";
import ProductCard from "./ProductCard.jsx";

export default function CategoryCarousel({ items = [] }) {
  const listRef = useRef(null);

  const scrollBy = (dir) => {
    listRef.current?.scrollBy?.({ left: dir * 520, behavior: "smooth" });
  };

  return (
    <section className="category-carousel" aria-label="Categorias">
      <div className="category-carousel__head">
        <h2 className="home-section__title">Categorias</h2>
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
          {items.map((item) => (
            <div className="product-strip__item" key={item.category}>
              <div className="category-tile">
                <div className="category-tile__title">{item.category}</div>
                <ProductCard product={item.product} />
              </div>
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

