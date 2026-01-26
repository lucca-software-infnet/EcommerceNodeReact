import ProductCard from "./ProductCard.jsx";

export default function CategoryCarousel({ items = [] }) {
  if (!items.length) return null;

  return (
    <section className="category-carousel" aria-label="Produtos por categoria">
      <div className="category-carousel__head">
        <h2 className="home-section__title">Categorias</h2>
        <div className="category-carousel__subtitle">1 produto por categoria</div>
      </div>

      <div className="category-grid">
        {items.map((item) => {
          const category =
            item?.categoria ||
            item?.category ||
            item?.departamento ||
            item?.produto?.departamento ||
            item?.product?.departamento;
          const product = item?.produto ?? item?.product ?? item;

          if (!product) return null;

          return (
            <div className="category-grid__item" key={`${category || "cat"}-${product.id}`}>
              <div className="category-grid__label">{category || "Categoria"}</div>
              <ProductCard product={product} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

