import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

import { generateTokens } from "../utils/generateTokens.js"
import { redis } from "../config/redis.js"
import { auditLog } from "./audit.service.js"
import { generateCryptoToken, hashToken } from "./crypto.service.js"

const prisma = new PrismaClient()

// ---------------- REGISTER ----------------
export const registerService = async (data) => {
  const hashedPassword = await bcrypt.hash(data.password, 10)

  const verificationToken = generateCryptoToken()
  const hashedVerification = hashToken(verificationToken)

  const user = await prisma.usuario.create({
    data: {
      nome: data.nome,
      sobrenome: data.sobrenome,
      email: data.email,
      password: hashedPassword,
      tokenAtivacao: hashedVerification,  // você cria coluna depois
    }
  })

  auditLog("USER_REGISTER", user.id)

  // retornar token puro pro controller enviar por email
  return { user, verificationToken }
}

// ---------------- LOGIN ----------------
export const loginService = async ({ email, password }) => {
  const user = await prisma.usuario.findUnique({ where: { email } })
  if (!user) return null

  const match = await bcrypt.compare(password, user.password)
  if (!match) return null

  const tokens = generateTokens({ id: user.id })

  await redis.set(`refresh:${user.id}`, tokens.refreshToken)

  auditLog("LOGIN_SUCCESS", user.id)

  return { user, tokens }
}

// ---------------- REFRESH TOKEN ----------------
export const refreshTokenService = async (userId, refreshToken) => {
  const storedToken = await redis.get(`refresh:${userId}`)
  if (storedToken !== refreshToken) return null

  const tokens = generateTokens({ id: userId })

  await redis.set(`refresh:${userId}`, tokens.refreshToken)

  auditLog("REFRESH_TOKEN", userId)

  return tokens
}

// ---------------- PASSWORD RESET REQUEST ----------------
export const requestPasswordResetService = async (email) => {
  const user = await prisma.usuario.findUnique({ where: { email } })
  if (!user) return null

  const token = generateCryptoToken()
  const hashed = hashToken(token)

  await prisma.usuario.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: hashed,
      resetPasswordExpires: new Date(Date.now() + 1000 * 60 * 15), // 15min
    }
  })

  auditLog("PASSWORD_RESET_REQUEST", user.id)

  return { user, token }
}
