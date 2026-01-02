import { useEffect, useMemo, useState } from "react";
import { heroSlideDataUrl } from "../../utils/placeholders.js";

export default function HeroCarousel({ slides = [] }) {
  const safeSlides = useMemo(() => slides.filter(Boolean), [slides]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (safeSlides.length <= 1) return;
    const t = setInterval(() => {
      setActiveIdx((i) => (i + 1) % safeSlides.length);
    }, 5500);
    return () => clearInterval(t);
  }, [safeSlides.length]);

  const active = safeSlides[activeIdx];
  const bg = heroSlideDataUrl({
    title: active?.title,
    subtitle: active?.subtitle,
  });

  const prev = () => setActiveIdx((i) => (i - 1 + safeSlides.length) % safeSlides.length);
  const next = () => setActiveIdx((i) => (i + 1) % safeSlides.length);

  if (!active) return null;

  return (
    <section className="hero" aria-label="Ofertas principais">
      <div className="hero__slide" style={{ backgroundImage: `url(${bg})` }}>
        <div className="hero__content">
          {active?.badge ? <div className="hero__badge">{active.badge}</div> : null}
          <h1 className="hero__title">{active?.title}</h1>
          {active?.subtitle ? <p className="hero__subtitle">{active.subtitle}</p> : null}
          <div className="hero__meta">Pagamentos seguros • Suporte • Devolução fácil</div>
        </div>

        {safeSlides.length > 1 ? (
          <div className="hero__controls">
            <button type="button" className="hero__ctrlBtn" onClick={prev} aria-label="Slide anterior">
              ‹
            </button>
            <div className="hero__dots" aria-label="Indicador de slide">
              {safeSlides.map((s, idx) => (
                <button
                  key={s.id || idx}
                  type="button"
                  className={idx === activeIdx ? "hero__dot hero__dot--active" : "hero__dot"}
                  onClick={() => setActiveIdx(idx)}
                  aria-label={`Ir para slide ${idx + 1}`}
                  aria-current={idx === activeIdx ? "true" : "false"}
                />
              ))}
            </div>
            <button type="button" className="hero__ctrlBtn" onClick={next} aria-label="Próximo slide">
              ›
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

