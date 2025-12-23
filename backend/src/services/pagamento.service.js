import { prisma } from "../lib/prisma.js"

export async function confirmarPagamento(compraId) {
  await prisma.$transaction(async (tx) => {

    await tx.pagamento.update({
      where: { compraId },
      data: { status: "APROVADO" }
    })

    await tx.compra.update({
      where: { id: compraId },
      data: { status: "PAGO" }
    })
  })
}

export async function cancelarPagamento(compraId) {
  await prisma.$transaction(async (tx) => {

    const itens = await tx.compraItem.findMany({
      where: { compraId }
    })

    // devolve estoque
    for (const item of itens) {
      await tx.produto.update({
        where: { id: item.produtoId },
        data: {
          quantidade: {
            increment: item.quantidade
          }
        }
      })

      await tx.estoqueMovimento.create({
        data: {
          produtoId: item.produtoId,
          tipo: "ENTRADA",
          quantidade: item.quantidade
        }
      })
    }

    await tx.pagamento.update({
      where: { compraId },
      data: { status: "RECUSADO" }
    })

    await tx.compra.update({
      where: { id: compraId },
      data: { status: "CANCELADO" }
    })
  })
}
