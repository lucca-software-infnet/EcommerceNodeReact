import { useEffect, useMemo, useState } from "react";

function heroArtDataUrl(title, subtitle) {
  const safeTitle = (title || "").slice(0, 26);
  const safeSubtitle = (subtitle || "").slice(0, 30);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="520" viewBox="0 0 1200 520">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="rgba(52,152,219,0.22)"/>
      <stop offset="1" stop-color="rgba(41,128,185,0.08)"/>
    </linearGradient>
    <linearGradient id="blob" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3498db"/>
      <stop offset="1" stop-color="#2980b9"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="520" rx="32" fill="url(#bg)"/>
  <circle cx="980" cy="220" r="180" fill="url(#blob)" opacity="0.22"/>
  <circle cx="1020" cy="330" r="110" fill="url(#blob)" opacity="0.16"/>
  <circle cx="880" cy="320" r="80" fill="url(#blob)" opacity="0.10"/>
  <text x="64" y="250" font-family="Segoe UI, Tahoma, Geneva, Verdana, sans-serif" font-size="42" font-weight="800" fill="#2c3e50">${safeTitle}</text>
  <text x="64" y="300" font-family="Segoe UI, Tahoma, Geneva, Verdana, sans-serif" font-size="18" font-weight="600" fill="#7f8c8d">${safeSubtitle}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function HeroCarousel() {
  const slides = useMemo(
    () => [
      {
        id: "s1",
        badge: "Ofertas principais",
        title: "Descontos em tecnologia",
        subtitle: "Parcelamento e entrega rápida em produtos selecionados.",
      },
      {
        id: "s2",
        badge: "Frete eficiente",
        title: "Casa & cozinha em alta",
        subtitle: "Itens essenciais com estoque nacional e compra garantida.",
      },
      {
        id: "s3",
        badge: "Recomendados",
        title: "Games e periféricos",
        subtitle: "Performance e confiança para jogar (e vender) melhor.",
      },
    ],
    []
  );

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const active = slides[index];
  const art = heroArtDataUrl(active.title, active.subtitle);

  return (
    <section className="hero" aria-label="Ofertas principais">
      <div className="hero__content">
        <div className="hero__badge">{active.badge}</div>
        <h1 className="hero__title">{active.title}</h1>
        <p className="hero__subtitle">{active.subtitle}</p>

        <div className="hero__actions">
          <button className="hero__primary" type="button">
            Ver ofertas
          </button>
          <button className="hero__secondary" type="button">
            Explorar categorias
          </button>
        </div>

        <div className="hero__dots" role="tablist" aria-label="Selecionar banner">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`hero__dot ${i === index ? "hero__dot--active" : ""}`}
              onClick={() => setIndex(i)}
              aria-label={`Banner ${i + 1}`}
              aria-pressed={i === index}
            />
          ))}
        </div>
      </div>

      <div className="hero__media" aria-hidden="true">
        <img className="hero__img" src={art} alt="" />
      </div>
    </section>
  );
}

