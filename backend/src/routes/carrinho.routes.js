import authMiddleware from "../middlewares/auth.middleware.js"

export async function carrinhoRoutes(app) {

  // ==========================================
  // OBTER CARRINHO DO USUÁRIO
  // ==========================================
  app.get("/carrinho", {
    preHandler: authMiddleware
  }, async (request, reply) => {
    const usuarioId = request.user.id

    let carrinho = await app.prisma.carrinho.findUnique({
      where: { usuarioId },
      include: {
        itens: {
          include: {
            produto: {
              include: {
                imagens: true
              }
            }
          }
        }
      }
    })

    // Se não existe, cria um carrinho vazio
    if (!carrinho) {
      carrinho = await app.prisma.carrinho.create({
        data: {
          usuarioId,
          total: 0
        },
        include: {
          itens: {
            include: {
              produto: {
                include: {
                  imagens: true
                }
              }
            }
          }
        }
      })
    }

    return carrinho
  })

  // ==========================================
  // ADICIONAR ITEM AO CARRINHO
  // ==========================================
  app.post("/carrinho/itens", {
    preHandler: authMiddleware
  }, async (request, reply) => {
    const usuarioId = request.user.id
    const { produtoId, quantidade } = request.body

    if (!produtoId || !quantidade || quantidade < 1) {
      return reply.code(400).send({ error: "produtoId e quantidade são obrigatórios" })
    }

    // Busca produto
    const produto = await app.prisma.produto.findUnique({
      where: { id: Number(produtoId) }
    })

    if (!produto) {
      return reply.code(404).send({ error: "Produto não encontrado" })
    }

    if (produto.quantidade < quantidade) {
      return reply.code(400).send({ error: "Estoque insuficiente" })
    }

    // Não pode comprar próprio produto
    if (produto.vendedorId === usuarioId) {
      return reply.code(400).send({ error: "Não é possível comprar seu próprio produto" })
    }

    // Garante que carrinho existe
    let carrinho = await app.prisma.carrinho.findUnique({
      where: { usuarioId }
    })

    if (!carrinho) {
      carrinho = await app.prisma.carrinho.create({
        data: {
          usuarioId,
          total: 0
        }
      })
    }

    // Verifica se item já existe no carrinho
    const itemExistente = await app.prisma.itemCarrinho.findFirst({
      where: {
        carrinhoId: carrinho.id,
        produtoId: Number(produtoId)
      }
    })

    if (itemExistente) {
      // Atualiza quantidade
      const novaQuantidade = itemExistente.quantidade + Number(quantidade)

      if (produto.quantidade < novaQuantidade) {
        return reply.code(400).send({ error: "Estoque insuficiente" })
      }

      await app.prisma.itemCarrinho.update({
        where: { id: itemExistente.id },
        data: { quantidade: novaQuantidade }
      })
    } else {
      // Cria novo item
      await app.prisma.itemCarrinho.create({
        data: {
          carrinhoId: carrinho.id,
          produtoId: Number(produtoId),
          quantidade: Number(quantidade),
          precoUnitario: produto.precoVenda
        }
      })
    }

    // Recalcula total do carrinho
    const itens = await app.prisma.itemCarrinho.findMany({
      where: { carrinhoId: carrinho.id }
    })

    const total = itens.reduce((acc, item) => {
      return acc + (item.quantidade * Number(item.precoUnitario))
    }, 0)

    const carrinhoAtualizado = await app.prisma.carrinho.update({
      where: { id: carrinho.id },
      data: { total },
      include: {
        itens: {
          include: {
            produto: {
              include: {
                imagens: true
              }
            }
          }
        }
      }
    })

    return carrinhoAtualizado
  })

  // ==========================================
  // ATUALIZAR QUANTIDADE DO ITEM
  // ==========================================
  app.put("/carrinho/itens/:itemId", {
    preHandler: authMiddleware
  }, async (request, reply) => {
    const usuarioId = request.user.id
    const itemId = Number(request.params.itemId)
    const { quantidade } = request.body

    if (!quantidade || quantidade < 1) {
      return reply.code(400).send({ error: "Quantidade deve ser maior que 0" })
    }

    const carrinho = await app.prisma.carrinho.findUnique({
      where: { usuarioId }
    })

    if (!carrinho) {
      return reply.code(404).send({ error: "Carrinho não encontrado" })
    }

    const item = await app.prisma.itemCarrinho.findFirst({
      where: {
        id: itemId,
        carrinhoId: carrinho.id
      },
      include: { produto: true }
    })

    if (!item) {
      return reply.code(404).send({ error: "Item não encontrado" })
    }

    if (item.produto.quantidade < quantidade) {
      return reply.code(400).send({ error: "Estoque insuficiente" })
    }

    await app.prisma.itemCarrinho.update({
      where: { id: itemId },
      data: { quantidade: Number(quantidade) }
    })

    // Recalcula total
    const itens = await app.prisma.itemCarrinho.findMany({
      where: { carrinhoId: carrinho.id }
    })

    const total = itens.reduce((acc, i) => {
      return acc + (i.quantidade * Number(i.precoUnitario))
    }, 0)

    const carrinhoAtualizado = await app.prisma.carrinho.update({
      where: { id: carrinho.id },
      data: { total },
      include: {
        itens: {
          include: {
            produto: {
              include: {
                imagens: true
              }
            }
          }
        }
      }
    })

    return carrinhoAtualizado
  })

  // ==========================================
  // REMOVER ITEM DO CARRINHO
  // ==========================================
  app.delete("/carrinho/itens/:itemId", {
    preHandler: authMiddleware
  }, async (request, reply) => {
    const usuarioId = request.user.id
    const itemId = Number(request.params.itemId)

    const carrinho = await app.prisma.carrinho.findUnique({
      where: { usuarioId }
    })

    if (!carrinho) {
      return reply.code(404).send({ error: "Carrinho não encontrado" })
    }

    const item = await app.prisma.itemCarrinho.findFirst({
      where: {
        id: itemId,
        carrinhoId: carrinho.id
      }
    })

    if (!item) {
      return reply.code(404).send({ error: "Item não encontrado" })
    }

    await app.prisma.itemCarrinho.delete({
      where: { id: itemId }
    })

    // Recalcula total
    const itens = await app.prisma.itemCarrinho.findMany({
      where: { carrinhoId: carrinho.id }
    })

    const total = itens.reduce((acc, i) => {
      return acc + (i.quantidade * Number(i.precoUnitario))
    }, 0)

    const carrinhoAtualizado = await app.prisma.carrinho.update({
      where: { id: carrinho.id },
      data: { total },
      include: {
        itens: {
          include: {
            produto: {
              include: {
                imagens: true
              }
            }
          }
        }
      }
    })

    return carrinhoAtualizado
  })

  // ==========================================
  // LIMPAR CARRINHO
  // ==========================================
  app.delete("/carrinho", {
    preHandler: authMiddleware
  }, async (request, reply) => {
    const usuarioId = request.user.id

    const carrinho = await app.prisma.carrinho.findUnique({
      where: { usuarioId }
    })

    if (!carrinho) {
      return reply.code(404).send({ error: "Carrinho não encontrado" })
    }

    await app.prisma.itemCarrinho.deleteMany({
      where: { carrinhoId: carrinho.id }
    })

    const carrinhoAtualizado = await app.prisma.carrinho.update({
      where: { id: carrinho.id },
      data: { total: 0 },
      include: {
        itens: true
      }
    })

    return carrinhoAtualizado
  })
}
