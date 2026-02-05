import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCartActions, useCartState, useCartSummary } from "../../contexts/CartContext.jsx";
import { formatBRL } from "../../utils/format.js";
import "./HeaderCart.css";

function CartIcon({ className }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6.2 6.5H21l-1.2 7.2a2 2 0 0 1-2 1.7H8.3a2 2 0 0 1-2-1.6L4.7 3.8A1.5 1.5 0 0 0 3.2 2.5H2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM18 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CartItemRow({ item, onInc, onDec, onRemove }) {
  const lineTotal = (item?.price || 0) * (item?.qty || 0);
  return (
    <div className="mini-cart__item">
      <img className="mini-cart__img" src={item?.image} alt={item?.name} loading="lazy" />

      <div className="mini-cart__meta">
        <div className="mini-cart__name" title={item?.name}>
          {item?.name}
        </div>

        <div className="mini-cart__row">
          <div className="mini-cart__qty">
            <button
              type="button"
              className="mini-cart__qtyBtn"
              onClick={onDec}
              aria-label={`Diminuir quantidade de ${item?.name}`}
              title="Diminuir"
            >
              −
            </button>
            <div className="mini-cart__qtyValue" aria-label="Quantidade">
              {item?.qty || 0}
            </div>
            <button
              type="button"
              className="mini-cart__qtyBtn"
              onClick={onInc}
              aria-label={`Aumentar quantidade de ${item?.name}`}
              title="Aumentar"
            >
              +
            </button>
          </div>

          <div className="mini-cart__prices">
            <div className="mini-cart__unit" title="Preço unitário">
              {formatBRL(item?.price)}
            </div>
            <div className="mini-cart__line" title="Total do item">
              {formatBRL(lineTotal)}
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="mini-cart__remove"
        onClick={onRemove}
        aria-label={`Remover ${item?.name} do carrinho`}
        title="Remover"
      >
        ×
      </button>
    </div>
  );
}

export default function HeaderCart() {
  const navigate = useNavigate();
  const { items } = useCartState();
  const { increment, decrement, remove } = useCartActions();
  const { itemCount, total } = useCartSummary();

  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const a11yLabel = useMemo(() => {
    const n = Number(itemCount || 0);
    const suffix = n === 1 ? "item" : "itens";
    return `Abrir carrinho (${n} ${suffix})`;
  }, [itemCount]);

  return (
    <div className="header-cart" ref={wrapRef}>
      <button
        type="button"
        className="header-cart__btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={a11yLabel}
        title="Carrinho"
      >
        <CartIcon className="header-cart__icon" />
        <span className={`header-cart__badge ${itemCount ? "is-filled" : ""}`} aria-label="Itens no carrinho">
          {Number(itemCount || 0)}
        </span>
      </button>

      {open ? (
        <div className="mini-cart" role="dialog" aria-label="Carrinho de compras">
          <div className="mini-cart__head">
            <div className="mini-cart__title">Meu carrinho</div>
            <button
              type="button"
              className="mini-cart__close"
              onClick={() => setOpen(false)}
              aria-label="Fechar carrinho"
              title="Fechar"
            >
              ×
            </button>
          </div>

          <div className="mini-cart__body">
            {items.length === 0 ? (
              <div className="mini-cart__empty">Seu carrinho está vazio.</div>
            ) : (
              items.map((it) => (
                <CartItemRow
                  key={it.id}
                  item={it}
                  onInc={() => increment(it.id)}
                  onDec={() => decrement(it.id)}
                  onRemove={() => remove(it.id)}
                />
              ))
            )}
          </div>

          <div className="mini-cart__footer">
            <div className="mini-cart__totalRow">
              <div className="mini-cart__totalLabel">Total</div>
              <div className="mini-cart__totalValue">{formatBRL(total)}</div>
            </div>

            <button
              type="button"
              className="mini-cart__cta"
              onClick={() => {
                setOpen(false);
                navigate("/cart");
              }}
            >
              Ver meu carrinho
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

