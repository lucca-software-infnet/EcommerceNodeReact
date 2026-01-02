function safeLabel(label, max = 18) {
  return String(label || "Produto").slice(0, max);
}

export function productImageDataUrl(label, seed) {
  const safe = safeLabel(label, 18);
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
  <text x="48" y="260" font-family="Segoe UI, Tahoma, Geneva, Verdana, sans-serif" font-size="16" font-weight="600" fill="#7f8c8d">Oferta • Seed ${seed ?? "-"}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function heroSlideDataUrl({ title = "Oferta", subtitle = "", accent = "#3498db" }) {
  const t = safeLabel(title, 26);
  const s = safeLabel(subtitle, 42);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="520" viewBox="0 0 1440 520">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="rgba(52,152,219,0.20)"/>
      <stop offset="1" stop-color="rgba(41,128,185,0.10)"/>
    </linearGradient>
  </defs>
  <rect width="1440" height="520" rx="32" fill="url(#bg)"/>
  <circle cx="1120" cy="170" r="170" fill="${accent}" opacity="0.14"/>
  <circle cx="1240" cy="330" r="110" fill="${accent}" opacity="0.10"/>
  <text x="80" y="240" font-family="Segoe UI, Tahoma, Geneva, Verdana, sans-serif" font-size="52" font-weight="800" fill="#2c3e50">${t}</text>
  <text x="80" y="300" font-family="Segoe UI, Tahoma, Geneva, Verdana, sans-serif" font-size="22" font-weight="600" fill="#7f8c8d">${s}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

