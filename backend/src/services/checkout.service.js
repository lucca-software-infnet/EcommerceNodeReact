import { prisma } from "../config/prisma.js"

export async function checkoutService({
  usuarioId,
  enderecoId,
  metodoPagamento
}) {
  return await prisma.$transaction(async (tx) => {

    // 1️⃣ Validar endereço do usuário
    const endereco = await tx.endereco.findFirst({
      where: {
        id: enderecoId,
        usuarioId: usuarioId
      }
    })

    if (!endereco) {
      throw new Error("Endereço inválido")
    }

    // 2️⃣ Buscar carrinho com itens e produtos
    const carrinho = await tx.carrinho.findUnique({
      where: { usuarioId },
      include: {
        itens: {
          include: {
            produto: true
          }
        }
      }
    })

    if (!carrinho || carrinho.itens.length === 0) {
      throw new Error("Carrinho vazio")
    }

    // 3️⃣ Validar estoque e calcular total
    let total = 0

    for (const item of carrinho.itens) {
      if (item.quantidade > item.produto.quantidade) {
        throw new Error(
          `Estoque insuficiente para ${item.produto.descricao}`
        )
      }

      total += item.quantidade * Number(item.precoUnitario)
    }

    // 4️⃣ Criar compra
    const compra = await tx.compra.create({
      data: {
        compradorId: usuarioId,
        // Decimal: usar string para evitar inconsistências de ponto flutuante
        total: total.toFixed(2),
        status: "PENDENTE"
      }
    })

    // 5️⃣ Criar snapshot do endereço
    await tx.enderecoCompra.create({
      data: {
        cep: endereco.cep,
        logradouro: endereco.logradouro,
        bairro: endereco.bairro,
        localidade: endereco.localidade,
        uf: endereco.uf,
        numero: endereco.numero,
        complemento: endereco.complemento,
        compraId: compra.id
      }
    })

    // 6️⃣ Criar itens da compra + baixar estoque
    for (const item of carrinho.itens) {

      await tx.compraItem.create({
        data: {
          compraId: compra.id,
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          precoUnit: item.precoUnitario,
          vendedorId: item.produto.vendedorId
        }
      })

      await tx.produto.update({
        where: { id: item.produtoId },
        data: {
          quantidade: {
            decrement: item.quantidade
          }
        }
      })

      await tx.estoqueMovimento.create({
        data: {
          produtoId: item.produtoId,
          tipo: "SAIDA",
          quantidade: item.quantidade
        }
      })
    }

    // 7️⃣ Criar pagamento (mock)
    await tx.pagamento.create({
      data: {
        compraId: compra.id,
        valor: total.toFixed(2),
        status: "PENDENTE",
        metodo: metodoPagamento
      }
    })

    // 8️⃣ Limpar carrinho
    await tx.itemCarrinho.deleteMany({
      where: { carrinhoId: carrinho.id }
    })

    await tx.carrinho.update({
      where: { id: carrinho.id },
      data: { total: 0 }
    })

    return compra
  })
}
