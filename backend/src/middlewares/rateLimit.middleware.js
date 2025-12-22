import redis from "../services/redis.service.js"

const MAX = 20       // reqs
const WINDOW = 60    // segundos

export default async function rateLimit(req, reply) {
  const ip = req.ip

  const key = `rate:${ip}`

  const count = await redis.incr(key)

  if (count === 1) {
    await redis.expire(key, WINDOW)
  }

  if (count > MAX) {
    return reply.code(429).send({
      erro: "Muitas requisições. Tente novamente mais tarde"
    })
  }
}
