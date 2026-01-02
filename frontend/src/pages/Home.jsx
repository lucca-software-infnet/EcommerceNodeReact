import { useMemo, useState } from "react";
import Header from "../components/Header.jsx";
import "./Home.css";

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
  <text x="48" y="260" font-family="Segoe UI, Tahoma, Geneva, Verdana, sans-serif" font-size="16" font-weight="600" fill="#7f8c8d">Oferta • Seed ${seed}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const MOCK_PRODUCTS = [
  { id: "p1", name: "Fone Bluetooth Pro ANC", price: 299.9, seed: 11 },
  { id: "p2", name: "Smartwatch Fitness 2", price: 219.9, seed: 22 },
  { id: "p3", name: "Mouse Gamer 16000 DPI", price: 149.9, seed: 33 },
  { id: "p4", name: "Teclado Mecânico Compacto", price: 399.9, seed: 44 },
  { id: "p5", name: "Câmera Wi‑Fi 1080p", price: 169.9, seed: 55 },
  { id: "p6", name: "Cadeira Ergonômica", price: 899.9, seed: 66 },
  { id: "p7", name: "Hub USB‑C 8 em 1", price: 189.9, seed: 77 },
  { id: "p8", name: "Caixa de Som Portátil", price: 249.9, seed: 88 },
];

export default function Home({ isInitializingSession = false }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_PRODUCTS;
    return MOCK_PRODUCTS.filter((p) => p.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="home">
      <Header onSearch={setQuery} initialQuery={query} isInitializingSession={isInitializingSession} />

      <main className="home__main">
        <section className="home-banner">
          <div className="home-banner__content">
            <div className="home-banner__badge">Promoções da semana</div>
            <h1 className="home-banner__title">Compre rápido. Receba com confiança.</h1>
            <p className="home-banner__subtitle">
              Ofertas reais, frete eficiente e experiência premium — do jeito que um ecommerce profissional precisa ser.
            </p>
            <div className="home-banner__ctaRow">
              <button className="home-banner__cta">Ver ofertas</button>
              <div className="home-banner__meta">Pagamentos seguros • Suporte • Devolução fácil</div>
            </div>
          </div>
          <div className="home-banner__art" aria-hidden="true" />
        </section>

        <section className="home-products">
          <div className="home-products__head">
            <h2 className="home-products__title">Destaques para você</h2>
            <div className="home-products__count">{filtered.length} itens</div>
          </div>

          <div className="product-grid">
            {filtered.map((p) => (
              <article key={p.id} className="product-card">
                <div className="product-card__imgWrap">
                  <img
                    className="product-card__img"
                    src={productImageDataUrl(p.name, p.seed)}
                    alt={p.name}
                    loading="lazy"
                  />
                </div>

                <div className="product-card__body">
                  <div className="product-card__name" title={p.name}>
                    {p.name}
                  </div>
                  <div className="product-card__price">{formatBRL(p.price)}</div>
                </div>

                <div className="product-card__footer">
                  <button className="product-card__btn" type="button">
                    Adicionar ao carrinho
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

