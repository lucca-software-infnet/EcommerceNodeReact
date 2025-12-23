import authMiddleware from "../middlewares/auth.middleware.js"

export async function enderecoRoutes(app) {

  // ==========================================
  // LISTAR ENDEREÇOS DO USUÁRIO
  // ==========================================
  app.get("/enderecos", {
    preHandler: authMiddleware
  }, async (request, reply) => {
    const usuarioId = request.user.id

    const enderecos = await app.prisma.endereco.findMany({
      where: { usuarioId },
      orderBy: { id: "desc" }
    })

    return enderecos
  })

  // ==========================================
  // OBTER ENDEREÇO POR ID
  // ==========================================
  app.get("/enderecos/:id", {
    preHandler: authMiddleware
  }, async (request, reply) => {
    const usuarioId = request.user.id
    const enderecoId = Number(request.params.id)

    const endereco = await app.prisma.endereco.findFirst({
      where: {
        id: enderecoId,
        usuarioId
      }
    })

    if (!endereco) {
      return reply.code(404).send({ error: "Endereço não encontrado" })
    }

    return endereco
  })

  // ==========================================
  // CRIAR ENDEREÇO
  // ==========================================
  app.post("/enderecos", {
    preHandler: authMiddleware
  }, async (request, reply) => {
    const usuarioId = request.user.id
    const {
      cep,
      logradouro,
      bairro,
      localidade,
      uf,
      numero,
      complemento
    } = request.body

    // Validação básica
    if (!cep || !logradouro || !bairro || !localidade || !uf) {
      return reply.code(400).send({
        error: "Campos obrigatórios: cep, logradouro, bairro, localidade, uf"
      })
    }

    const endereco = await app.prisma.endereco.create({
      data: {
        cep,
        logradouro,
        bairro,
        localidade,
        uf,
        numero: numero || null,
        complemento: complemento || null,
        usuarioId
      }
    })

    return reply.code(201).send(endereco)
  })

  // ==========================================
  // ATUALIZAR ENDEREÇO
  // ==========================================
  app.put("/enderecos/:id", {
    preHandler: authMiddleware
  }, async (request, reply) => {
    const usuarioId = request.user.id
    const enderecoId = Number(request.params.id)

    const endereco = await app.prisma.endereco.findFirst({
      where: {
        id: enderecoId,
        usuarioId
      }
    })

    if (!endereco) {
      return reply.code(404).send({ error: "Endereço não encontrado" })
    }

    const {
      cep,
      logradouro,
      bairro,
      localidade,
      uf,
      numero,
      complemento
    } = request.body

    const enderecoAtualizado = await app.prisma.endereco.update({
      where: { id: enderecoId },
      data: {
        cep: cep !== undefined ? cep : undefined,
        logradouro: logradouro !== undefined ? logradouro : undefined,
        bairro: bairro !== undefined ? bairro : undefined,
        localidade: localidade !== undefined ? localidade : undefined,
        uf: uf !== undefined ? uf : undefined,
        numero: numero !== undefined ? numero : undefined,
        complemento: complemento !== undefined ? complemento : undefined
      }
    })

    return enderecoAtualizado
  })

  // ==========================================
  // DELETAR ENDEREÇO
  // ==========================================
  app.delete("/enderecos/:id", {
    preHandler: authMiddleware
  }, async (request, reply) => {
    const usuarioId = request.user.id
    const enderecoId = Number(request.params.id)

    const endereco = await app.prisma.endereco.findFirst({
      where: {
        id: enderecoId,
        usuarioId
      }
    })

    if (!endereco) {
      return reply.code(404).send({ error: "Endereço não encontrado" })
    }

    await app.prisma.endereco.delete({
      where: { id: enderecoId }
    })

    return { message: "Endereço excluído com sucesso" }
  })
}
