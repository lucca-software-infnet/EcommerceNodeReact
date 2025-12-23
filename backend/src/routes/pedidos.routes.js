import authMiddleware from "../middlewares/auth.middleware.js"

export async function pedidosRoutes(app) {

  // Listar todos os pedidos do usuário
  app.get("/me/pedidos", {
    preHandler: authMiddleware
  }, async (request, reply) => {

    const usuarioId = request.user.id

    const pedidos = await app.prisma.compra.findMany({
      where: {
        compradorId: usuarioId
      },
      orderBy: {
        dataCompra: "desc"
      },
      include: {
        endereco: true,
        pagamento: true,
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

    return pedidos
  })

  // Buscar pedido específico do usuário
  app.get("/me/pedidos/:id", {
    preHandler: authMiddleware
  }, async (request, reply) => {

    const usuarioId = request.user.id
    const pedidoId = Number(request.params.id)

    const pedido = await app.prisma.compra.findFirst({
      where: {
        id: pedidoId,
        compradorId: usuarioId
      },
      include: {
        endereco: true,
        pagamento: true,
        itens: {
          include: {
            produto: true
          }
        }
      }
    })

    if (!pedido) {
      return reply.code(404).send({ error: "Pedido não encontrado" })
    }

    return pedido
  })
}



