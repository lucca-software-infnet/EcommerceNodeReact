import redis from "../services/redis.service.js"
import jwt from "jsonwebtoken"

export default async function redisSession(req, reply) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader)
      return reply.code(401).send({ erro: "Token não enviado" })

    const token = authHeader.split(" ")[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const exists = await redis.get(`session:${decoded.id}`)

    if (!exists)
      return reply.code(401).send({ erro: "Sessão expirada ou inválida" })

    req.user = { userId: decoded.id }

  } catch (err) {
    return reply.code(401).send({ erro: "Sessão inválida" })
  }
}
