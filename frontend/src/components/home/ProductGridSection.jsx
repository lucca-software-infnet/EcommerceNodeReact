import ProductCard from "./ProductCard.jsx";
import "./ProductGridSection.css";

export default function ProductGridSection({ title, products = [] }) {
  return (
    <section className="pgridSec" aria-label={title}>
      <div className="pgridSec__head">
        <h2 className="pgridSec__title">{title}</h2>
      </div>

      <div className="pgridSec__grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

