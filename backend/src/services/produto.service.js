import { prisma } from "../lib/prisma.js";

function asOptionalDate(value) {
  if (value === null) return null;
  if (value === undefined) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error("Validade inválida");
  return d;
}

function asInt(value, field) {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new Error(`${field} deve ser um número inteiro`);
  }
  return n;
}

function asNonNegativeInt(value, field) {
  const n = asInt(value, field);
  if (n < 0) throw new Error(`${field} não pode ser negativo`);
  return n;
}

function asMoney(value, field) {
  // Prisma aceita number/string/Decimal. Normalizamos para string com 2 casas.
  const n = typeof value === "string" ? Number(value.replace(",", ".")) : value;
  if (!Number.isFinite(n)) throw new Error(`${field} inválido`);
  if (n < 0) throw new Error(`${field} não pode ser negativo`);
  return n.toFixed(2);
}

function normalizeString(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return String(value).trim();
}

function produtoSelect() {
  return {
    id: true,
    codigoBarra: true,
    descricao: true,
    validade: true,
    volume: true,
    quantidade: true,
    precoCusto: true,
    precoVenda: true,
    marca: true,
    departamento: true,
    dataRegistro: true,
    vendedorId: true,
    vendedor: {
      select: { id: true, nome: true, sobrenome: true, imagem: true },
    },
    imagens: { select: { id: true, nomeArquivo: true } },
  };
}

function toProdutoDTO(produto) {
  if (!produto) return null;
  return {
    ...produto,
    imagens: (produto.imagens || []).map(
      (img) => `/uploads/products/${produto.id}/${img.nomeArquivo}`
    ),
  };
}

function prismaErrorToMessage(err) {
  // Prisma v5/v6/v7: erro possui "code"
  const code = err?.code;
  if (code === "P2002") return "Código de barras já cadastrado";
  if (code === "P2025") return "Produto não encontrado";
  if (code === "P2003") return "Não foi possível concluir por vínculo com outros registros";
  return null;
}

function withStatus(message, statusCode) {
  return Object.assign(new Error(message), { statusCode });
}

class ProdutoService {
  async registrarMovimentoEstoque(tx, { produtoId, tipo, quantidade }) {
    const qtd = asNonNegativeInt(quantidade, "Quantidade do movimento");
    if (!["ENTRADA", "SAIDA"].includes(tipo)) {
      throw new Error("Tipo de movimento inválido");
    }

    return tx.estoqueMovimento.create({
      data: {
        produtoId: Number(produtoId),
        tipo,
        quantidade: qtd,
      },
    });
  }

  async createProduto(vendedorId, data) {
    const userId = Number(vendedorId);
    if (!Number.isFinite(userId)) throw new Error("Vendedor inválido");

    const codigoBarra = normalizeString(data?.codigoBarra);
    const descricao = normalizeString(data?.descricao);
    const departamento = normalizeString(data?.departamento);

    if (!codigoBarra) throw new Error("codigoBarra é obrigatório");
    if (!descricao) throw new Error("descricao é obrigatória");
    if (!departamento) throw new Error("departamento é obrigatório");

    const volume = asNonNegativeInt(data?.volume, "volume");
    const quantidade = data?.quantidade === undefined
      ? 0
      : asNonNegativeInt(data?.quantidade, "quantidade");

    const precoCusto = asMoney(data?.precoCusto, "precoCusto");
    const precoVenda = asMoney(data?.precoVenda, "precoVenda");
    const marca = normalizeString(data?.marca);
    const validade = asOptionalDate(data?.validade);

    try {
      const created = await prisma.$transaction(async (tx) => {
        const produto = await tx.produto.create({
          data: {
            codigoBarra,
            descricao,
            validade,
            volume,
            quantidade,
            precoCusto,
            precoVenda,
            marca,
            departamento,
            vendedorId: userId,
          },
          select: produtoSelect(),
        });

        // Regra: ao criar produto, registra ENTRADA (mesmo se 0)
        await this.registrarMovimentoEstoque(tx, {
          produtoId: produto.id,
          tipo: "ENTRADA",
          quantidade: produto.quantidade,
        });

        return produto;
      });

      return toProdutoDTO(created);
    } catch (err) {
      const msg = prismaErrorToMessage(err);
      if (msg) {
        const status = err.code === "P2002" ? 409 : 400;
        throw withStatus(msg, status);
      }
      throw err;
    }
  }

  async listProdutosPublicos(query = {}) {
    const page = query?.page ? asNonNegativeInt(query.page, "page") : 1;
    const limit = query?.limit ? asNonNegativeInt(query.limit, "limit") : 20;
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const q = normalizeString(query?.q);
    const departamento = normalizeString(query?.departamento);
    const marca = normalizeString(query?.marca);

    const where = {
      ...(departamento ? { departamento } : {}),
      ...(marca ? { marca } : {}),
      ...(q
        ? {
            OR: [
              { descricao: { contains: q } },
              { codigoBarra: { contains: q } },
              { departamento: { contains: q } },
              { marca: { contains: q } },
            ],
          }
        : {}),
    };

    const [total, rows] = await prisma.$transaction([
      prisma.produto.count({ where }),
      prisma.produto.findMany({
        where,
        orderBy: { dataRegistro: "desc" },
        skip,
        take,
        select: produtoSelect(),
      }),
    ]);

    return {
      page: Math.max(page, 1),
      limit: take,
      total,
      items: rows.map(toProdutoDTO),
    };
  }

  async getProdutoById(id) {
    const produtoId = Number(id);
    if (!Number.isFinite(produtoId)) throw new Error("ID inválido");

    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
      select: produtoSelect(),
    });

    if (!produto) throw withStatus("Produto não encontrado", 404);
    return toProdutoDTO(produto);
  }

  async updateProduto(id, vendedorId, data) {
    const produtoId = Number(id);
    const userId = Number(vendedorId);
    if (!Number.isFinite(produtoId)) throw new Error("ID inválido");
    if (!Number.isFinite(userId)) throw new Error("Vendedor inválido");

    const existing = await prisma.produto.findUnique({
      where: { id: produtoId },
      select: { id: true, vendedorId: true, quantidade: true },
    });
    if (!existing) throw withStatus("Produto não encontrado", 404);
    if (existing.vendedorId !== userId) throw withStatus("Sem permissão", 403);

    const patch = {};

    if (data?.codigoBarra !== undefined) {
      const codigoBarra = normalizeString(data.codigoBarra);
      if (!codigoBarra) throw new Error("codigoBarra não pode ser vazio");
      patch.codigoBarra = codigoBarra;
    }
    if (data?.descricao !== undefined) {
      const descricao = normalizeString(data.descricao);
      if (!descricao) throw new Error("descricao não pode ser vazia");
      patch.descricao = descricao;
    }
    if (data?.departamento !== undefined) {
      const departamento = normalizeString(data.departamento);
      if (!departamento) throw new Error("departamento não pode ser vazio");
      patch.departamento = departamento;
    }
    if (data?.marca !== undefined) {
      patch.marca = normalizeString(data.marca);
    }
    if (data?.validade !== undefined) {
      patch.validade = asOptionalDate(data.validade);
    }
    if (data?.volume !== undefined) {
      patch.volume = asNonNegativeInt(data.volume, "volume");
    }
    if (data?.precoCusto !== undefined) {
      patch.precoCusto = asMoney(data.precoCusto, "precoCusto");
    }
    if (data?.precoVenda !== undefined) {
      patch.precoVenda = asMoney(data.precoVenda, "precoVenda");
    }

    const nextQuantidade =
      data?.quantidade === undefined
        ? undefined
        : asNonNegativeInt(data.quantidade, "quantidade");

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const produto = await tx.produto.update({
          where: { id: produtoId },
          data: {
            ...patch,
            ...(nextQuantidade === undefined ? {} : { quantidade: nextQuantidade }),
          },
          select: produtoSelect(),
        });

        if (nextQuantidade !== undefined && nextQuantidade !== existing.quantidade) {
          const diff = nextQuantidade - existing.quantidade;
          await this.registrarMovimentoEstoque(tx, {
            produtoId,
            tipo: diff > 0 ? "ENTRADA" : "SAIDA",
            quantidade: Math.abs(diff),
          });
        }

        return produto;
      });

      return toProdutoDTO(updated);
    } catch (err) {
      const msg = prismaErrorToMessage(err);
      if (msg) {
        const status = err.code === "P2002" ? 409 : 400;
        throw withStatus(msg, status);
      }
      throw err;
    }
  }

  async deleteProduto(id, vendedorId) {
    const produtoId = Number(id);
    const userId = Number(vendedorId);
    if (!Number.isFinite(produtoId)) throw new Error("ID inválido");
    if (!Number.isFinite(userId)) throw new Error("Vendedor inválido");

    const existing = await prisma.produto.findUnique({
      where: { id: produtoId },
      select: { id: true, vendedorId: true },
    });
    if (!existing) throw withStatus("Produto não encontrado", 404);
    if (existing.vendedorId !== userId) throw withStatus("Sem permissão", 403);

    const compraItems = await prisma.compraItem.count({ where: { produtoId } });
    if (compraItems > 0) {
      throw withStatus(
        "Produto possui itens de compra associados e não pode ser removido",
        409
      );
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Remove itens de carrinho (FK RESTRICT) para permitir exclusão do produto
        await tx.itemCarrinho.deleteMany({ where: { produtoId } });

        // Remove movimentos (FK RESTRICT) antes do produto
        await tx.estoqueMovimento.deleteMany({ where: { produtoId } });

        // Imagens são cascade no BD, mas deletar explicitamente mantém previsível
        await tx.imagemProduto.deleteMany({ where: { produtoId } });

        await tx.produto.delete({ where: { id: produtoId } });
      });

      return { msg: "Produto removido com sucesso" };
    } catch (err) {
      const msg = prismaErrorToMessage(err);
      if (msg) throw withStatus(msg, 409);
      throw err;
    }
  }
}

export default new ProdutoService();

