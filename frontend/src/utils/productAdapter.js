export function toCatalogProduct(apiProduto) {
  if (!apiProduto) return null;

  const firstImg = Array.isArray(apiProduto.imagens) ? apiProduto.imagens[0] : null;
  const imageUrl = firstImg?.url || null;

  const priceNum =
    typeof apiProduto.precoVenda === "number"
      ? apiProduto.precoVenda
      : apiProduto.precoVenda != null
        ? Number(apiProduto.precoVenda)
        : null;

  return {
    id: String(apiProduto.id),
    name: apiProduto.descricao ?? "",
    price: Number.isFinite(priceNum) ? priceNum : 0,
    category: apiProduto.departamento ?? "",
    seed: apiProduto.id ?? 0,
    imageUrl,
    raw: apiProduto,
  };
}

