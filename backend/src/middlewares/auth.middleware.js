import jwt from "jsonwebtoken"

export default async function authMiddleware(req, reply) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader)
      return reply.code(401).send({ erro: "Token não enviado" })

    const token = authHeader.split(" ")[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = { userId: decoded.id }

  } catch (err) {
    return reply.code(401).send({ erro: "Token inválido" })
  }
}
