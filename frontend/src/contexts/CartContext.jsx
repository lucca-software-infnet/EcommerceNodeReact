import { createContext, useCallback, useContext, useMemo, useReducer } from "react";
import { productImageDataUrl } from "../utils/placeholders.js";

function normalizeProduct(input) {
  if (!input) return null;

  // Suporta tanto o formato "catalog" (id/name/price/imageUrl) quanto o "raw" da API.
  const id =
    input?.id != null
      ? String(input.id)
      : input?.raw?.id != null
        ? String(input.raw.id)
        : null;
  if (!id) return null;

  const name =
    (typeof input?.name === "string" && input.name.trim()) ||
    (typeof input?.descricao === "string" && input.descricao.trim()) ||
    (typeof input?.raw?.descricao === "string" && input.raw.descricao.trim()) ||
    "";

  const priceCandidate =
    input?.price ??
    input?.precoVenda ??
    input?.raw?.precoVenda ??
    input?.raw?.price ??
    0;
  const price = Number.isFinite(Number(priceCandidate)) ? Number(priceCandidate) : 0;

  const seed = input?.seed ?? input?.raw?.id ?? input?.id ?? 0;
  const imageUrl = input?.imageUrl || input?.raw?.imageUrl || null;
  const image = imageUrl || productImageDataUrl(name, seed);

  return { id, name, price, image };
}

function clampQty(qty) {
  const n = Number(qty);
  if (!Number.isFinite(n)) return 1;
  return Math.max(0, Math.floor(n));
}

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_OR_INCREMENT": {
      const p = normalizeProduct(action.product);
      if (!p) return state;

      const existingIdx = state.items.findIndex((x) => x.id === p.id);
      if (existingIdx === -1) {
        return {
          ...state,
          items: [...state.items, { ...p, qty: 1 }],
        };
      }

      const nextItems = state.items.slice();
      const cur = nextItems[existingIdx];
      nextItems[existingIdx] = { ...cur, qty: cur.qty + 1 };
      return { ...state, items: nextItems };
    }

    case "INCREMENT": {
      const id = String(action.id || "");
      if (!id) return state;
      const idx = state.items.findIndex((x) => x.id === id);
      if (idx === -1) return state;

      const nextItems = state.items.slice();
      const cur = nextItems[idx];
      nextItems[idx] = { ...cur, qty: cur.qty + 1 };
      return { ...state, items: nextItems };
    }

    case "DECREMENT": {
      const id = String(action.id || "");
      if (!id) return state;
      const idx = state.items.findIndex((x) => x.id === id);
      if (idx === -1) return state;

      const cur = state.items[idx];
      if (cur.qty <= 1) {
        return { ...state, items: state.items.filter((x) => x.id !== id) };
      }

      const nextItems = state.items.slice();
      nextItems[idx] = { ...cur, qty: cur.qty - 1 };
      return { ...state, items: nextItems };
    }

    case "REMOVE": {
      const id = String(action.id || "");
      if (!id) return state;
      if (!state.items.some((x) => x.id === id)) return state;
      return { ...state, items: state.items.filter((x) => x.id !== id) };
    }

    case "SET_QTY": {
      const id = String(action.id || "");
      if (!id) return state;
      const qty = clampQty(action.qty);
      const idx = state.items.findIndex((x) => x.id === id);
      if (idx === -1) return state;
      if (qty <= 0) return { ...state, items: state.items.filter((x) => x.id !== id) };

      const nextItems = state.items.slice();
      nextItems[idx] = { ...nextItems[idx], qty };
      return { ...state, items: nextItems };
    }

    case "CLEAR": {
      if (state.items.length === 0) return state;
      return { ...state, items: [] };
    }

    default:
      return state;
  }
}

const CartStateContext = createContext(null);
const CartActionsContext = createContext(null);

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const addItem = useCallback((product) => dispatch({ type: "ADD_OR_INCREMENT", product }), []);
  const increment = useCallback((id) => dispatch({ type: "INCREMENT", id }), []);
  const decrement = useCallback((id) => dispatch({ type: "DECREMENT", id }), []);
  const remove = useCallback((id) => dispatch({ type: "REMOVE", id }), []);
  const setQty = useCallback((id, qty) => dispatch({ type: "SET_QTY", id, qty }), []);
  const clear = useCallback(() => dispatch({ type: "CLEAR" }), []);

  const actions = useMemo(
    () => ({ addItem, increment, decrement, remove, setQty, clear }),
    [addItem, increment, decrement, remove, setQty, clear]
  );

  return (
    <CartStateContext.Provider value={state}>
      <CartActionsContext.Provider value={actions}>{children}</CartActionsContext.Provider>
    </CartStateContext.Provider>
  );
}

export function useCartState() {
  const ctx = useContext(CartStateContext);
  if (!ctx) throw new Error("useCartState must be used within CartProvider");
  return ctx;
}

export function useCartActions() {
  const ctx = useContext(CartActionsContext);
  if (!ctx) throw new Error("useCartActions must be used within CartProvider");
  return ctx;
}

export function useCartSummary() {
  const { items } = useCartState();
  return useMemo(() => {
    const itemCount = items.reduce((acc, it) => acc + (it.qty || 0), 0);
    const total = items.reduce((acc, it) => acc + (it.price || 0) * (it.qty || 0), 0);
    return { itemCount, total };
  }, [items]);
}

