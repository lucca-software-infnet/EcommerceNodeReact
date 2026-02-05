import { formatBRL } from "../../utils/format.js";
import { productImageDataUrl } from "../../utils/placeholders.js";
import { useCartActions } from "../../contexts/CartContext.jsx";

export default function ProductCard({ product }) {
  const { addItem } = useCartActions();
  const img = product?.imageUrl || productImageDataUrl(product?.name, product?.seed);

  return (
    <article className="product-card">
      <div className="product-card__imgWrap">
        <img className="product-card__img" src={img} alt={product?.name} loading="lazy" />
      </div>

      <div className="product-card__body">
        <div className="product-card__name" title={product?.name}>
          {product?.name}
        </div>
        <div className="product-card__price">{formatBRL(product?.price)}</div>
      </div>

      <div className="product-card__footer">
        <button className="product-card__btn" type="button" onClick={() => addItem(product)}>
          Adicionar ao carrinho
        </button>
      </div>
    </article>
  );
}

