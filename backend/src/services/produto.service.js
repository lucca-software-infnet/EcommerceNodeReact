import path from "path";
import { prisma } from "../lib/prisma.js";
import { saveImage } from "../utils/uploadImage.js";

function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}

function toInt(value, { field, min = null } = {}) {
  const n = typeof value === "string" && value.trim() !== ""
    ? Number(value)
    : value;

  if (!Number.isInteger(n)) {
    throw new Error(`${field} deve ser um inteiro válido`);
  }
  if (min !== null && n < min) {
    throw new Error(`${field} deve ser maior ou igual a ${min}`);
  }
  return n;
}

function toOptionalDate(value, { field } = {}) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`${field} inválida`);
  return d;
}

function toRequiredString(value, { field } = {}) {
  const s = String(value ?? "").trim();
  if (!s) throw new Error(`${field} é obrigatório`);
  return s;
}

function toOptionalString(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

function toMoney(value, { field } = {}) {
  const n = typeof value === "string" && value.trim() !== ""
    ? Number(value)
    : value;
  if (!isFiniteNumber(n)) throw new Error(`${field} deve ser um número válido`);
  if (n < 0) throw new Error(`${field} não pode ser negativo`);
  // Prisma Decimal aceita number/string.
  return n;
}

function mapProdutoWithImageUrls(produto) {
  if (!produto) return produto;
  const imagens = (produto.imagens || []).map((img) => ({
    id: img.id,
    nomeArquivo: img.nomeArquivo,
    url: `/uploads/products/${produto.id}/${img.nomeArquivo}`,
  }));
  return { ...produto, imagens };
}

class ProdutoService {
  /**
   * Interno: registra movimento de estoque
   */
  async registrarMovimentoEstoque(tx, { produtoId, tipo, quantidade }) {
    const t = String(tipo || "").toUpperCase();
    if (!["ENTRADA", "SAIDA"].includes(t)) {
      throw new Error("Tipo de movimento inválido");
    }
    const q = toInt(quantidade, { field: "quantidade", min: 0 });
    return tx.estoqueMovimento.create({
      data: {
        tipo: t,
        quantidade: q,
        produtoId: Number(produtoId),
      },
    });
  }

  async createProduto(vendedorId, payload = {}) {
    const sellerId = toInt(vendedorId, { field: "vendedorId", min: 1 });

    const data = {
      codigoBarra: toRequiredString(payload.codigoBarra, { field: "codigoBarra" }),
      descricao: toRequiredString(payload.descricao, { field: "descricao" }),
      validade: toOptionalDate(payload.validade, { field: "validade" }),
      volume: toInt(payload.volume, { field: "volume", min: 0 }),
      quantidade: payload.quantidade === undefined
        ? 0
        : toInt(payload.quantidade, { field: "quantidade", min: 0 }),
      precoCusto: toMoney(payload.precoCusto, { field: "precoCusto" }),
      precoVenda: toMoney(payload.precoVenda, { field: "precoVenda" }),
      marca: toOptionalString(payload.marca),
      departamento: toRequiredString(payload.departamento, { field: "departamento" }),
      vendedorId: sellerId,
    };

    try {
      const produto = await prisma.$transaction(async (tx) => {
        const produto = await tx.produto.create({
          data,
          include: { imagens: { select: { id: true, nomeArquivo: true } } },
        });

        // requisito: ao criar produto, registrar ENTRADA inicial
        await this.registrarMovimentoEstoque(tx, {
          produtoId: produto.id,
          tipo: "ENTRADA",
          quantidade: produto.quantidade,
        });

        return produto;
      });

      return mapProdutoWithImageUrls(produto);
    } catch (err) {
      // Prisma P2002: unique constraint
      if (err?.code === "P2002") {
        throw new Error("Código de barras já cadastrado");
      }
      throw err;
    }
  }

  async listProdutosPublicos(query = {}) {
    const page = query.page === undefined ? 1 : toInt(Number(query.page), { field: "page", min: 1 });
    const limit = query.limit === undefined ? 20 : toInt(Number(query.limit), { field: "limit", min: 1 });
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    const where = {};
    if (query.vendedorId !== undefined) {
      where.vendedorId = toInt(Number(query.vendedorId), { field: "vendedorId", min: 1 });
    }
    if (query.departamento) {
      where.departamento = String(query.departamento).trim();
    }
    if (query.marca) {
      where.marca = String(query.marca).trim();
    }
    if (query.codigoBarra) {
      where.codigoBarra = String(query.codigoBarra).trim();
    }
    if (query.q) {
      const q = String(query.q).trim();
      if (q) {
        where.OR = [
          { descricao: { contains: q } },
          { departamento: { contains: q } },
          { marca: { contains: q } },
          { codigoBarra: { contains: q } },
        ];
      }
    }

    const produtos = await prisma.produto.findMany({
      where,
      orderBy: { dataRegistro: "desc" },
      skip,
      take,
      include: { imagens: { select: { id: true, nomeArquivo: true } } },
    });

    return produtos.map(mapProdutoWithImageUrls);
  }

  async getProdutoById(id) {
    const produtoId = toInt(id, { field: "id", min: 1 });
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
      include: {
        imagens: { select: { id: true, nomeArquivo: true } },
      },
    });

    if (!produto) throw new Error("Produto não encontrado");
    return mapProdutoWithImageUrls(produto);
  }

  async updateProduto(vendedorId, id, payload = {}) {
    const sellerId = toInt(vendedorId, { field: "vendedorId", min: 1 });
    const produtoId = toInt(id, { field: "id", min: 1 });

    const data = {
      // não permite trocar vendedorId via payload
      codigoBarra: payload.codigoBarra !== undefined
        ? toRequiredString(payload.codigoBarra, { field: "codigoBarra" })
        : undefined,
      descricao: payload.descricao !== undefined
        ? toRequiredString(payload.descricao, { field: "descricao" })
        : undefined,
      validade: toOptionalDate(payload.validade, { field: "validade" }),
      volume: payload.volume !== undefined
        ? toInt(payload.volume, { field: "volume", min: 0 })
        : undefined,
      quantidade: payload.quantidade !== undefined
        ? toInt(payload.quantidade, { field: "quantidade", min: 0 })
        : undefined,
      precoCusto: payload.precoCusto !== undefined
        ? toMoney(payload.precoCusto, { field: "precoCusto" })
        : undefined,
      precoVenda: payload.precoVenda !== undefined
        ? toMoney(payload.precoVenda, { field: "precoVenda" })
        : undefined,
      marca: payload.marca !== undefined ? toOptionalString(payload.marca) : undefined,
      departamento: payload.departamento !== undefined
        ? toRequiredString(payload.departamento, { field: "departamento" })
        : undefined,
    };

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const current = await tx.produto.findUnique({
          where: { id: produtoId },
          include: { imagens: { select: { id: true, nomeArquivo: true } } },
        });

        if (!current) throw new Error("Produto não encontrado");
        if (current.vendedorId !== sellerId) throw new Error("Sem permissão");

        const nextQuantidade =
          data.quantidade === undefined ? current.quantidade : data.quantidade;

        const produto = await tx.produto.update({
          where: { id: produtoId },
          data,
          include: { imagens: { select: { id: true, nomeArquivo: true } } },
        });

        // requisito: ao alterar estoque, registrar ENTRADA/SAIDA conforme diferença
        if (nextQuantidade !== current.quantidade) {
          const diff = nextQuantidade - current.quantidade;
          await this.registrarMovimentoEstoque(tx, {
            produtoId: produtoId,
            tipo: diff > 0 ? "ENTRADA" : "SAIDA",
            quantidade: Math.abs(diff),
          });
        }

        return produto;
      });

      return mapProdutoWithImageUrls(updated);
    } catch (err) {
      if (err?.code === "P2002") {
        throw new Error("Código de barras já cadastrado");
      }
      throw err;
    }
  }

  async deleteProduto(vendedorId, id) {
    const sellerId = toInt(vendedorId, { field: "vendedorId", min: 1 });
    const produtoId = toInt(id, { field: "id", min: 1 });

    await prisma.$transaction(async (tx) => {
      const produto = await tx.produto.findUnique({
        where: { id: produtoId },
        select: { id: true, vendedorId: true },
      });

      if (!produto) throw new Error("Produto não encontrado");
      if (produto.vendedorId !== sellerId) throw new Error("Sem permissão");

      // não apaga histórico de venda: bloqueia remoção se já foi vendido
      const vendido = await tx.compraItem.findFirst({
        where: { produtoId },
        select: { id: true },
      });
      if (vendido) {
        throw new Error("Produto não pode ser removido pois já possui vendas");
      }

      // remove de carrinhos e dependências para liberar FK
      await tx.itemCarrinho.deleteMany({ where: { produtoId } });
      await tx.imagemProduto.deleteMany({ where: { produtoId } });
      await tx.estoqueMovimento.deleteMany({ where: { produtoId } });

      await tx.produto.delete({ where: { id: produtoId } });
    });

    return { ok: true };
  }

  /**
   * Upload de imagens do produto (mantém endpoint existente)
   */
  async uploadImagensProduto(vendedorId, produtoId, filesAsyncIterable) {
    const sellerId = toInt(vendedorId, { field: "vendedorId", min: 1 });
    const id = toInt(produtoId, { field: "id", min: 1 });

    const produto = await prisma.produto.findFirst({
      where: { id, vendedorId: sellerId },
      select: { id: true },
    });
    if (!produto) throw new Error("Sem permissão");

    const uploadDir = path.join("uploads", "products", String(id));

    // mantém comportamento anterior: filenames 1.jpg, 2.jpg, ...
    let index = 1;
    const createdUrls = [];

    for await (const file of filesAsyncIterable) {
      const buffer = await file.toBuffer();
      const filename = `${index}.jpg`;

      await saveImage({
        buffer,
        uploadDir,
        filename,
        overwrite: false,
      });

      await prisma.imagemProduto.create({
        data: {
          nomeArquivo: filename,
          produtoId: id,
        },
      });

      createdUrls.push(`/uploads/products/${id}/${filename}`);
      index++;
    }

    return { imagens: createdUrls };
  }
}

export default new ProdutoService();

