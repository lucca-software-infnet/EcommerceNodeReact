function productImageDataUrl(label, seed) {
  const safe = (label || "Produto").slice(0, 22);
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
  <text x="48" y="214" font-family="Segoe UI, Tahoma, Geneva, Verdana, sans-serif" font-size="28" font-weight="700" fill="#2c3e50">${safe}</text>
  <text x="48" y="254" font-family="Segoe UI, Tahoma, Geneva, Verdana, sans-serif" font-size="16" font-weight="600" fill="#7f8c8d">Pronta-entrega • Seed ${seed}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const CATEGORIES = [
  { id: "cat-eletronicos", name: "Eletrônicos" },
  { id: "cat-informatica", name: "Informática" },
  { id: "cat-casa", name: "Casa & Cozinha" },
  { id: "cat-games", name: "Games" },
  { id: "cat-audio", name: "Áudio" },
  { id: "cat-esporte", name: "Esporte" },
  { id: "cat-beleza", name: "Beleza" },
  { id: "cat-ofertas", name: "Ofertas relâmpago" },
];

export const PRODUCTS = [
  { id: "p1", name: "Fone Bluetooth Pro ANC", price: 299.9, seed: 11, category: "cat-audio" },
  { id: "p2", name: "Smartwatch Fitness 2", price: 219.9, seed: 22, category: "cat-esporte" },
  { id: "p3", name: "Mouse Gamer 16000 DPI", price: 149.9, seed: 33, category: "cat-games" },
  { id: "p4", name: "Teclado Mecânico Compacto", price: 399.9, seed: 44, category: "cat-informatica" },
  { id: "p5", name: "Câmera Wi‑Fi 1080p", price: 169.9, seed: 55, category: "cat-casa" },
  { id: "p6", name: "Cadeira Ergonômica", price: 899.9, seed: 66, category: "cat-informatica" },
  { id: "p7", name: "Hub USB‑C 8 em 1", price: 189.9, seed: 77, category: "cat-informatica" },
  { id: "p8", name: "Caixa de Som Portátil", price: 249.9, seed: 88, category: "cat-audio" },
  { id: "p9", name: "Air Fryer Digital 4L", price: 449.9, seed: 91, category: "cat-casa" },
  { id: "p10", name: "SSD NVMe 1TB", price: 389.9, seed: 102, category: "cat-informatica" },
  { id: "p11", name: "Controle Wireless", price: 279.9, seed: 113, category: "cat-games" },
  { id: "p12", name: "Monitor 27\" IPS", price: 1299.9, seed: 124, category: "cat-informatica" },
  { id: "p13", name: "Liquidificador Turbo", price: 159.9, seed: 135, category: "cat-casa" },
  { id: "p14", name: "Kit Skincare Diário", price: 119.9, seed: 146, category: "cat-beleza" },
  { id: "p15", name: "Tablet 10\" 64GB", price: 899.9, seed: 157, category: "cat-eletronicos" },
  { id: "p16", name: "Roteador Wi‑Fi 6", price: 329.9, seed: 168, category: "cat-informatica" },
  { id: "p17", name: "Cafeteira Programável", price: 219.9, seed: 179, category: "cat-casa" },
  { id: "p18", name: "Barbeador Elétrico", price: 199.9, seed: 181, category: "cat-beleza" },
  { id: "p19", name: "Headset Gamer 7.1", price: 239.9, seed: 192, category: "cat-games" },
  { id: "p20", name: "Power Bank 20.000mAh", price: 169.9, seed: 203, category: "cat-eletronicos" },
];

export function formatBRL(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function withImages(products) {
  return products.map((p) => ({
    ...p,
    imageUrl: productImageDataUrl(p.name, p.seed),
  }));
}

