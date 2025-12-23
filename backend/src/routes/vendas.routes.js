import authMiddleware from "../middlewares/auth.middleware.js"

export async function vendasRoutes(app) {

  app.get("/vendedor/vendas", {
    preHandler: authMiddleware
  }, async (request, reply) => {

    const vendedorId = request.user.id

    const vendas = await app.prisma.compraItem.findMany({
      where: {
        vendedorId
      },
      orderBy: {
        id: "desc"
      },
      include: {
        compra: {
          include: {
            endereco: true,
            pagamento: true
          }
        },
        produto: true
      }
    })

    return vendas
  })
}
