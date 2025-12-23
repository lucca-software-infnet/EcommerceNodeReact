import path from "path";
import authMiddleware from "../middlewares/auth.middleware.js";
import { saveImage } from "../utils/uploadImage.js";

export default async function produtoRoutes(app) {

  // ==========================================
  // LISTAR TODOS OS PRODUTOS (público)
  // ==========================================
  app.get("/produtos", async (req, reply) => {
    const { departamento, marca, q, page = 1, limit = 20 } = req.query;

    const where = {};
    if (departamento) where.departamento = departamento;
    if (marca) where.marca = marca;
    if (q) {
      where.descricao = { contains: q };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [produtos, total] = await Promise.all([
      app.prisma.produto.findMany({
        where,
        skip,
        take,
        include: {
          imagens: true,
          vendedor: {
            select: { id: true, nome: true }
          }
        },
        orderBy: { dataRegistro: "desc" }
      }),
      app.prisma.produto.count({ where })
    ]);

    return {
      produtos,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / take)
    };
  });

  // ==========================================
  // BUSCAR PRODUTO POR ID (público)
  // ==========================================
  app.get("/produtos/:id", async (req, reply) => {
    const produtoId = Number(req.params.id);

    const produto = await app.prisma.produto.findUnique({
      where: { id: produtoId },
      include: {
        imagens: true,
        vendedor: {
          select: { id: true, nome: true }
        }
      }
    });

    if (!produto) {
      return reply.code(404).send({ error: "Produto não encontrado" });
    }

    return produto;
  });

  // ==========================================
  // CRIAR PRODUTO (autenticado)
  // ==========================================
  app.post("/produtos", {
    preHandler: authMiddleware
  }, async (req, reply) => {
    const vendedorId = req.user.id;
    const {
      codigoBarra,
      descricao,
      validade,
      volume,
      quantidade,
      precoCusto,
      precoVenda,
      marca,
      departamento
    } = req.body;

    // Validação básica
    if (!codigoBarra || !descricao || !volume || !departamento || !precoCusto || !precoVenda) {
      return reply.code(400).send({
        error: "Campos obrigatórios: codigoBarra, descricao, volume, departamento, precoCusto, precoVenda"
      });
    }

    try {
      const produto = await app.prisma.produto.create({
        data: {
          codigoBarra,
          descricao,
          validade: validade ? new Date(validade) : null,
          volume: Number(volume),
          quantidade: Number(quantidade) || 0,
          precoCusto: Number(precoCusto),
          precoVenda: Number(precoVenda),
          marca: marca || null,
          departamento,
          vendedorId
        },
        include: {
          imagens: true,
          vendedor: {
            select: { id: true, nome: true }
          }
        }
      });

      return reply.code(201).send(produto);
    } catch (error) {
      if (error.code === "P2002") {
        return reply.code(400).send({ error: "Código de barras já cadastrado" });
      }
      throw error;
    }
  });

  // ==========================================
  // ATUALIZAR PRODUTO (autenticado, dono)
  // ==========================================
  app.put("/produtos/:id", {
    preHandler: authMiddleware
  }, async (req, reply) => {
    const produtoId = Number(req.params.id);
    const userId = req.user.id;

    const produto = await app.prisma.produto.findFirst({
      where: { id: produtoId, vendedorId: userId }
    });

    if (!produto && !req.user.ehAdmin) {
      return reply.code(403).send({ error: "Sem permissão" });
    }

    const {
      descricao,
      validade,
      volume,
      quantidade,
      precoCusto,
      precoVenda,
      marca,
      departamento
    } = req.body;

    const updated = await app.prisma.produto.update({
      where: { id: produtoId },
      data: {
        descricao: descricao !== undefined ? descricao : undefined,
        validade: validade !== undefined ? (validade ? new Date(validade) : null) : undefined,
        volume: volume !== undefined ? Number(volume) : undefined,
        quantidade: quantidade !== undefined ? Number(quantidade) : undefined,
        precoCusto: precoCusto !== undefined ? Number(precoCusto) : undefined,
        precoVenda: precoVenda !== undefined ? Number(precoVenda) : undefined,
        marca: marca !== undefined ? marca : undefined,
        departamento: departamento !== undefined ? departamento : undefined
      },
      include: {
        imagens: true,
        vendedor: {
          select: { id: true, nome: true }
        }
      }
    });

    return updated;
  });

  // ==========================================
  // DELETAR PRODUTO (autenticado, dono ou admin)
  // ==========================================
  app.delete("/produtos/:id", {
    preHandler: authMiddleware
  }, async (req, reply) => {
    const produtoId = Number(req.params.id);
    const userId = req.user.id;

    const produto = await app.prisma.produto.findFirst({
      where: { id: produtoId, vendedorId: userId }
    });

    if (!produto && !req.user.ehAdmin) {
      return reply.code(403).send({ error: "Sem permissão" });
    }

    await app.prisma.produto.delete({
      where: { id: produtoId }
    });

    return { message: "Produto excluído com sucesso" };
  });

  // ==========================================
  // MEUS PRODUTOS (vendedor)
  // ==========================================
  app.get("/vendedor/produtos", {
    preHandler: authMiddleware
  }, async (req, reply) => {
    const vendedorId = req.user.id;

    const produtos = await app.prisma.produto.findMany({
      where: { vendedorId },
      include: {
        imagens: true
      },
      orderBy: { dataRegistro: "desc" }
    });

    return produtos;
  });

  // ==========================================
  // UPLOAD DE IMAGENS DO PRODUTO
  // ==========================================
  app.post(
    "/produtos/:id/imagens",
    {
      preHandler: authMiddleware,
      config: {
        limits: {
          files: 6
        }
      }
    },
    async (req, reply) => {
      const produtoId = Number(req.params.id);
      const userId = req.user.id;

      const produto = await app.prisma.produto.findFirst({
        where: { id: produtoId, vendedorId: userId }
      });

      if (!produto && !req.user.ehAdmin) {
        return reply.code(403).send({ error: "Sem permissão" });
      }

      const files = await req.files();
      const uploadDir = path.join("uploads", "products", String(produtoId));

      // Conta imagens existentes para continuar a numeração
      const existingImages = await app.prisma.imagemProduto.count({
        where: { produtoId }
      });

      let index = existingImages + 1;
      const imagens = [];

      for await (const file of files) {
        const buffer = await file.toBuffer();
        const filename = `${index}.jpg`;

        await saveImage({
          buffer,
          uploadDir,
          filename,
          overwrite: true
        });

        await app.prisma.imagemProduto.create({
          data: {
            nomeArquivo: filename,
            produtoId
          }
        });

        imagens.push(`/uploads/products/${produtoId}/${filename}`);
        index++;
      }

      return { imagens };
    }
  );

  // ==========================================
  // DELETAR IMAGEM DO PRODUTO
  // ==========================================
  app.delete("/produtos/:id/imagens/:imagemId", {
    preHandler: authMiddleware
  }, async (req, reply) => {
    const produtoId = Number(req.params.id);
    const imagemId = Number(req.params.imagemId);
    const userId = req.user.id;

    const produto = await app.prisma.produto.findFirst({
      where: { id: produtoId, vendedorId: userId }
    });

    if (!produto && !req.user.ehAdmin) {
      return reply.code(403).send({ error: "Sem permissão" });
    }

    await app.prisma.imagemProduto.delete({
      where: { id: imagemId }
    });

    return { message: "Imagem excluída" };
  });
}
