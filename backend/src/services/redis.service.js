import { redis } from "../config/redis.js"

export const saveRefreshToken = async (userId, token) => {
  await redis.set(`refresh:${userId}`, token)
}

export const getRefreshToken = async (userId) => {
  return await redis.get(`refresh:${userId}`)
}

export const deleteRefreshToken = async (userId) => {
  await redis.del(`refresh:${userId}`)
}
