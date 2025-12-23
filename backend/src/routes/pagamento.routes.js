import { cancelarPagamento, confirmarPagamento } from "../services/pagamento.service.js";

export default async function pagamentoRoutes(app) {

  app.post("/pagamentos/webhook", async (request, reply) => {

    const { compraId, status } = request.body || {}
    // status: APROVADO | RECUSADO
    const numericCompraId = Number(compraId)
    if (!numericCompraId || !status) {
      return reply.code(400).send({ error: "Payload inválido" })
    }

    const compra = await app.prisma.compra.findUnique({
      where: { id: numericCompraId },
      include: { pagamento: true }
    })

    if (!compra || !compra.pagamento) {
      return reply.code(404).send({ error: "Compra inválida" })
    }

    if (compra.status !== "PENDENTE") {
      return reply.send({ message: "Compra já processada" })
    }

    if (status === "APROVADO") {
      await confirmarPagamento(numericCompraId)
    } else {
      await cancelarPagamento(numericCompraId)
    }

    return { ok: true }
  })
}
