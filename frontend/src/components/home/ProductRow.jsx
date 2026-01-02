import ProductCard from "./ProductCard.jsx";

export default function ProductRow({ title, products }) {
  return (
    <section className="home-section">
      <div className="home-section__head">
        <h2 className="home-section__title">{title}</h2>
        <div className="home-section__link" aria-hidden="true">
          Ver mais
        </div>
      </div>

      <div className="product-grid product-grid--row4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

