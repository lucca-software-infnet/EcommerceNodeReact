import { redis } from "../config/redis.js"
import { verifyAccessToken } from "../utils/jwtTokens.js"

export default async function redisSession(req, reply) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader)
      return reply.code(401).send({ erro: "Token não enviado" })

    const token = authHeader.split(" ")[1]

    const decoded = verifyAccessToken(token)

    if (!redis || !redis.isOpen) {
      // Redis not available, continue without session check
      req.user = { id: decoded.id, ehAdmin: !!decoded.ehAdmin }
      return
    }

    const exists = await redis.get(`session:${decoded.id}`)

    if (!exists)
      return reply.code(401).send({ erro: "Sessão expirada ou inválida" })

    req.user = { id: decoded.id, ehAdmin: !!decoded.ehAdmin }

  } catch (err) {
    return reply.code(401).send({ erro: "Sessão inválida" })
  }
}
