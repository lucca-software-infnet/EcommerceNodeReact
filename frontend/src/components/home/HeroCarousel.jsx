import { useEffect, useMemo, useState } from "react";
import "./HeroCarousel.css";

function nextIndex(i, len) {
  if (!len) return 0;
  return (i + 1) % len;
}

function prevIndex(i, len) {
  if (!len) return 0;
  return (i - 1 + len) % len;
}

export default function HeroCarousel({ slides = [] }) {
  const safeSlides = useMemo(() => slides.filter(Boolean), [slides]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (safeSlides.length <= 1) return;
    const t = setInterval(() => setActive((i) => nextIndex(i, safeSlides.length)), 6500);
    return () => clearInterval(t);
  }, [safeSlides.length]);

  const slide = safeSlides[active];

  if (!slide) return null;

  return (
    <section className={`hero hero--${slide.theme || "blue"}`} aria-label="Ofertas em destaque">
      <div className="hero__viewport">
        <div className="hero__content">
          <div className="hero__badge">{slide.badge}</div>
          <h1 className="hero__title">{slide.title}</h1>
          <p className="hero__subtitle">{slide.subtitle}</p>

          <div className="hero__ctaRow">
            <button className="hero__cta" type="button">
              {slide.cta}
            </button>
            <div className="hero__meta">Compra segura • Devolução fácil • Suporte</div>
          </div>
        </div>

        <div className="hero__art" aria-hidden="true" />

        {safeSlides.length > 1 ? (
          <>
            <button
              type="button"
              className="hero__nav hero__nav--prev"
              aria-label="Oferta anterior"
              onClick={() => setActive((i) => prevIndex(i, safeSlides.length))}
            >
              ‹
            </button>
            <button
              type="button"
              className="hero__nav hero__nav--next"
              aria-label="Próxima oferta"
              onClick={() => setActive((i) => nextIndex(i, safeSlides.length))}
            >
              ›
            </button>

            <div className="hero__dots" role="tablist" aria-label="Selecionar oferta">
              {safeSlides.map((s, idx) => (
                <button
                  key={s.id || idx}
                  type="button"
                  className={`hero__dot ${idx === active ? "is-active" : ""}`}
                  aria-label={`Ir para oferta ${idx + 1}`}
                  aria-pressed={idx === active}
                  onClick={() => setActive(idx)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

