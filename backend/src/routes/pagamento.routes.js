export async function pagamentoRoutes(app) {

  app.post("/pagamentos/webhook", async (request, reply) => {

    const { compraId, status } = request.body
    // status: APROVADO | RECUSADO

    const compra = await app.prisma.compra.findUnique({
      where: { id: compraId },
      include: { pagamento: true }
    })

    if (!compra || !compra.pagamento) {
      return reply.code(404).send({ error: "Compra inválida" })
    }

    if (compra.status !== "PENDENTE") {
      return reply.send({ message: "Compra já processada" })
    }

    if (status === "APROVADO") {
      await confirmarPagamento(compraId)
    } else {
      await cancelarPagamento(compraId)
    }

    return { ok: true }
  })
}
