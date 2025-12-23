import { confirmarPagamento, cancelarPagamento } from "../services/pagamento.service.js"

export async function pagamentoRoutes(app) {

  app.post("/pagamentos/webhook", async (request, reply) => {

    const { compraId, status } = request.body
    // status: APROVADO | RECUSADO
    const compraIdNum = Number(compraId)
    if (!Number.isFinite(compraIdNum) || !status) {
      return reply.code(400).send({ error: "Payload inválido" })
    }

    const compra = await app.prisma.compra.findUnique({
      where: { id: compraIdNum },
      include: { pagamento: true }
    })

    if (!compra || !compra.pagamento) {
      return reply.code(404).send({ error: "Compra inválida" })
    }

    if (compra.status !== "PENDENTE") {
      return reply.send({ message: "Compra já processada" })
    }

    if (status === "APROVADO") {
      await confirmarPagamento(compraIdNum)
    } else {
      await cancelarPagamento(compraIdNum)
    }

    return { ok: true }
  })
}
