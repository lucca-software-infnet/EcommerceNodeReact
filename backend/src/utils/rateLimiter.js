import { redis } from "../config/redis.js"

export const rateLimiter = async (key, limit, ttlSeconds) => {
  const current = await redis.incr(key)

  if (current === 1) {
    await redis.expire(key, ttlSeconds)
  }

  return current > limit
}
