import { MercadoPagoConfig, Preference } from "mercadopago";

import { env } from "../config/env.js";

function joinUrl(base, pathname) {
  const b = String(base || "").trim().replace(/\/+$/, "");
  const p = String(pathname || "").trim();
  const path = p.startsWith("/") ? p : `/${p}`;
  return `${b}${path}`;
}

function toCents(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n <= 0) return null;
  return Math.round(n * 100);
}

function ensureSafeTitle(input) {
  const raw = typeof input === "string" ? input : "";
  const title = raw.trim();
  // Mercado Pago aceita strings, mas evitamos payloads enormes / vazios.
  if (!title) return null;
  if (title.length > 120) return title.slice(0, 120);
  return title;
}

function normalizeCartItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    const err = new Error("Carrinho vazio ou inválido");
    err.statusCode = 400;
    throw err;
  }

  if (rawItems.length > 100) {
    const err = new Error("Muitos itens no carrinho");
    err.statusCode = 400;
    throw err;
  }

  let totalCents = 0;
  const items = rawItems.map((raw, idx) => {
    const title = ensureSafeTitle(raw?.nome ?? raw?.name ?? raw?.title);
    const quantity = Number(raw?.quantidade ?? raw?.quantity ?? raw?.qty);
    const unitPriceCents = toCents(raw?.precoUnitario ?? raw?.unit_price ?? raw?.unitPrice ?? raw?.price);

    if (!title) {
      const err = new Error(`Item #${idx + 1}: nome inválido`);
      err.statusCode = 400;
      throw err;
    }

    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity) || quantity > 1000) {
      const err = new Error(`Item #${idx + 1}: quantidade inválida`);
      err.statusCode = 400;
      throw err;
    }

    if (unitPriceCents == null) {
      const err = new Error(`Item #${idx + 1}: preço unitário inválido`);
      err.statusCode = 400;
      throw err;
    }

    totalCents += unitPriceCents * quantity;

    return {
      title,
      quantity,
      unit_price: Number((unitPriceCents / 100).toFixed(2)),
      currency_id: "BRL",
    };
  });

  if (totalCents <= 0) {
    const err = new Error("Total inválido");
    err.statusCode = 400;
    throw err;
  }

  return { items, totalCents };
}

function centsFromFrontendTotal(frontendTotal) {
  if (frontendTotal == null) return null;
  const n = Number(frontendTotal);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export async function createCheckoutProPreference({ cartItems, frontendTotal }) {
  if (!env.mercadoPagoAccessToken) {
    const err = new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");
    err.statusCode = 500;
    throw err;
  }

  const { items, totalCents } = normalizeCartItems(cartItems);

  // Segurança: o total do frontend não é confiável; usamos apenas para detectar divergência.
  const frontendTotalCents = centsFromFrontendTotal(frontendTotal);
  if (frontendTotalCents != null) {
    const diff = Math.abs(frontendTotalCents - totalCents);
    // tolera diferença de até 1 centavo (arredondamentos)
    if (diff > 1) {
      const err = new Error("Total informado é diferente do total calculado");
      err.statusCode = 400;
      throw err;
    }
  }

  const client = new MercadoPagoConfig({
    accessToken: env.mercadoPagoAccessToken,
    options: { timeout: 10000 },
  });

  const preference = new Preference(client);

  const body = {
    items,
    back_urls: {
      success: joinUrl(env.frontendUrl, "/checkout/success"),
      failure: joinUrl(env.frontendUrl, "/checkout/failure"),
      pending: joinUrl(env.frontendUrl, "/checkout/pending"),
    },
    auto_return: "approved",
  };

  const result = await preference.create({ body });

  return {
    preferenceId: result?.id,
    init_point: result?.init_point,
  };
}

