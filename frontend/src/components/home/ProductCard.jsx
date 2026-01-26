import { formatBRL } from "../../utils/format.js";
import { productImageDataUrl } from "../../utils/placeholders.js";

export default function ProductCard({ product }) {
  const name = product?.name ?? product?.descricao ?? "";
  const price = product?.price ?? product?.precoVenda ?? product?.precoCusto ?? 0;
  const img =
    product?.imageUrl ||
    product?.imagens?.[0]?.url ||
    productImageDataUrl(name, product?.seed);

  return (
    <article className="product-card">
      <div className="product-card__imgWrap">
        <img className="product-card__img" src={img} alt={name} loading="lazy" />
      </div>

      <div className="product-card__body">
        <div className="product-card__name" title={name}>
          {name}
        </div>
        <div className="product-card__price">{formatBRL(price)}</div>
      </div>

      <div className="product-card__footer">
        <button className="product-card__btn" type="button">
          Adicionar ao carrinho
        </button>
      </div>
    </article>
  );
}

