import { api } from "../api/client.js";

export async function startCheckoutPro({ items, total }) {
  const { data } = await api.post("/payments/checkout", {
    items,
    total,
  });

  return data;
}

