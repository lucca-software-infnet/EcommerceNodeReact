import { formatBRL } from "./mockCatalog.js";

export default function ProductCard({ product }) {
  return (
    <article className="product-card">
      <div className="product-card__imgWrap">
        <img className="product-card__img" src={product.imageUrl} alt={product.name} loading="lazy" />
      </div>

      <div className="product-card__body">
        <div className="product-card__name" title={product.name}>
          {product.name}
        </div>
        <div className="product-card__price">{formatBRL(product.price)}</div>
        <div className="product-card__meta">Frete rápido • Compra garantida</div>
      </div>

      <div className="product-card__footer">
        <button className="product-card__btn" type="button">
          Adicionar ao carrinho
        </button>
      </div>
    </article>
  );
}

