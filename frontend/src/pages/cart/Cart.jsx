import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCartActions, useCartState } from "../../contexts/CartContext.jsx";
import { startCheckoutPro } from "../../services/payments.service.js";
import { formatBRL } from "../../utils/format.js";
import "./Cart.css";

function CartRow({ item, onInc, onDec, onRemove }) {
  const lineTotal = (item?.price || 0) * (item?.qty || 0);

  return (
    <div className="cart-row">
      <div className="cart-row__left">
        <img className="cart-row__img" src={item?.image} alt={item?.name} loading="lazy" />
        <div className="cart-row__info">
          <div className="cart-row__name" title={item?.name}>
            {item?.name}
          </div>
          <div className="cart-row__unit">Unitário: {formatBRL(item?.price)}</div>
        </div>
      </div>

      <div className="cart-row__qty" aria-label="Quantidade">
        <button type="button" className="cart-row__qtyBtn" onClick={onDec} aria-label="Diminuir quantidade">
          −
        </button>
        <div className="cart-row__qtyValue">{item?.qty || 0}</div>
        <button type="button" className="cart-row__qtyBtn" onClick={onInc} aria-label="Aumentar quantidade">
          +
        </button>
      </div>

      <div className="cart-row__total" aria-label="Total do item">
        {formatBRL(lineTotal)}
      </div>

      <button type="button" className="cart-row__remove" onClick={onRemove} aria-label="Remover item">
        ×
      </button>
    </div>
  );
}

export default function Cart() {
  const { items } = useCartState();
  const { increment, decrement, remove } = useCartActions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const total = useMemo(() => items.reduce((acc, it) => acc + (it.price || 0) * (it.qty || 0), 0), [items]);
  const itemCount = useMemo(() => items.reduce((acc, it) => acc + (it.qty || 0), 0), [items]);

  async function handleCheckout() {
    if (items.length === 0 || isSubmitting) return;

    setCheckoutError("");
    setIsSubmitting(true);

    try {
      const payloadItems = items.map((it) => ({
        id: it.id,
        nome: it.name,
        precoUnitario: it.price,
        quantidade: it.qty,
      }));

      const data = await startCheckoutPro({
        items: payloadItems,
        total,
      });

      const initPoint = data?.init_point;
      if (!initPoint) {
        throw new Error("Resposta inválida do servidor");
      }

      // Checkout Pro padrão: redirecionamento full page (sem iframe).
      window.location.assign(initPoint);
    } catch (err) {
      const apiMsg = err?.response?.data?.error;
      const msg = apiMsg || err?.message || "Não foi possível iniciar o pagamento";
      setCheckoutError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="cart-page">
      <main className="cart-page__main">
        <header className="cart-page__head">
          <div>
            <h1 className="cart-page__title">Carrinho</h1>
            <p className="cart-page__subtitle">{itemCount} item(ns)</p>
          </div>
          <Link to="/" className="cart-page__back">
            Continuar comprando
          </Link>
        </header>

        {items.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty__title">Seu carrinho está vazio.</div>
            <div className="cart-empty__subtitle">Adicione produtos para ver eles aqui.</div>
            <Link to="/" className="cart-empty__cta">
              Ver ofertas
            </Link>
          </div>
        ) : (
          <div className="cart-grid">
            <section className="cart-card" aria-label="Itens do carrinho">
              <div className="cart-list">
                {items.map((it) => (
                  <CartRow
                    key={it.id}
                    item={it}
                    onInc={() => increment(it.id)}
                    onDec={() => decrement(it.id)}
                    onRemove={() => remove(it.id)}
                  />
                ))}
              </div>
            </section>

            <aside className="cart-card cart-summary" aria-label="Resumo do carrinho">
              <div className="cart-summary__title">Resumo</div>
              <div className="cart-summary__row">
                <span>Total</span>
                <strong>{formatBRL(total)}</strong>
              </div>
              <div className="cart-summary__hint">O layout do carrinho será refinado posteriormente.</div>
              {checkoutError ? (
                <div role="alert" style={{ color: "#b42318", marginTop: 8, fontSize: 14 }}>
                  {checkoutError}
                </div>
              ) : null}
              <button
                type="button"
                className="cart-summary__cta"
                onClick={handleCheckout}
                disabled={items.length === 0 || isSubmitting}
              >
                {isSubmitting ? "Redirecionando..." : "Finalizar compra"}
              </button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

