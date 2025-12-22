export default async function errorMiddleware(error, req, reply) {
  console.error("Erro:", error.message)

  reply.code(error.statusCode || 500).send({
    erro: error.message || "Erro interno do servidor"
  })
}
