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

  const descricao = String(apiProduto.descricao ?? "").trim();
  const marca = String(apiProduto.marca ?? "").trim();

  let name = descricao;
  if (marca) {
    const d = descricao.toLowerCase();
    const m = marca.toLowerCase();
    // evita duplicar marca se já estiver na descrição
    name = d.includes(m) ? descricao : `${marca} ${descricao}`.trim();
  }

  return {
    id: String(apiProduto.id),
    name,
    price: Number.isFinite(priceNum) ? priceNum : 0,
    category: apiProduto.departamento ?? "",
    seed: apiProduto.id ?? 0,
    imageUrl,
    raw: apiProduto,
  };
}

