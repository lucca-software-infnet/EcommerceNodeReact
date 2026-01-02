import "./ProductCard.css";

function formatBRL(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function productImageDataUrl(label, seed) {
  const safe = (label || "Produto").slice(0, 18);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f5f5f5"/>
      <stop offset="1" stop-color="#e8eef5"/>
    </linearGradient>
  </defs>
  <rect width="640" height="420" rx="24" fill="url(#g)"/>
  <circle cx="520" cy="120" r="82" fill="rgba(52,152,219,0.20)"/>
  <circle cx="560" cy="240" r="44" fill="rgba(52,152,219,0.14)"/>
  <text x="48" y="220" font-family="Segoe UI, Tahoma, Geneva, Verdana, sans-serif" font-size="30" font-weight="700" fill="#2c3e50">${safe}</text>
  <text x="48" y="260" font-family="Segoe UI, Tahoma, Geneva, Verdana, sans-serif" font-size="16" font-weight="600" fill="#7f8c8d">Oferta • #${seed}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function ProductCard({ product, variant = "default" }) {
  const img = product?.imageUrl || product?.image || productImageDataUrl(product?.name, product?.seed);

  return (
    <article className={`pcard pcard--${variant}`}>
      <div className="pcard__imgWrap">
        <img className="pcard__img" src={img} alt={product?.name} loading="lazy" />
      </div>

      <div className="pcard__body">
        <div className="pcard__name" title={product?.name}>
          {product?.name}
        </div>
        <div className="pcard__price">{formatBRL(product?.price || 0)}</div>
      </div>

      {variant === "default" ? (
        <div className="pcard__footer">
          <button className="pcard__btn" type="button">
            Adicionar ao carrinho
          </button>
        </div>
      ) : null}
    </article>
  );
}

