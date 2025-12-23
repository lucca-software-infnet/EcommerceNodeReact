import bcrypt from "bcrypt";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { auditLog } from "./audit.service.js";
import jwt from "jsonwebtoken";
import { hashToken } from "./crypto.service.js";
import { sendEmail } from "./email.service.js";
import {
  REFRESH_TOKEN_TTL_SECONDS,
  newJti,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwtTokens.js";

function safeUser(user) {
  if (!user) return null;
  // remove campos sensíveis
  // eslint-disable-next-line no-unused-vars
  const { password, ...rest } = user;
  return rest;
}

async function saveRefreshToken(redis, userId, refreshToken) {
  if (!redis || !redis.isOpen) return;
  const tokenHash = hashToken(refreshToken);
  await redis.set(`refresh:${userId}`, tokenHash, { EX: REFRESH_TOKEN_TTL_SECONDS });
}

async function getRefreshTokenHash(redis, userId) {
  if (!redis || !redis.isOpen) return null;
  return await redis.get(`refresh:${userId}`);
}

async function deleteRefreshToken(redis, userId) {
  if (!redis || !redis.isOpen) return;
  await redis.del(`refresh:${userId}`);
}

function signPasswordResetToken(userId) {
  if (!env.jwtRefreshSecret) throw new Error("JWT_REFRESH_SECRET não configurado");
  return jwt.sign(
    { id: Number(userId), typ: "pwdreset" },
    env.jwtRefreshSecret,
    { expiresIn: "15m", issuer: env.jwtIssuer }
  );
}

function verifyPasswordResetToken(token) {
  if (!env.jwtRefreshSecret) throw new Error("JWT_REFRESH_SECRET não configurado");
  const decoded = jwt.verify(token, env.jwtRefreshSecret, { issuer: env.jwtIssuer });
  if (decoded?.typ !== "pwdreset") throw new Error("Token inválido");
  return decoded;
}

const authService = {
  async register({ email, senha, nome = "Usuário", sobrenome = null }, { ip, userAgent } = {}) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail || !senha) throw new Error("Email e senha são obrigatórios");

    const existing = await prisma.usuario.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw new Error("Email já cadastrado");

    const hashedPassword = await bcrypt.hash(senha, 12);
    const user = await prisma.usuario.create({
      data: {
        nome,
        sobrenome,
        email: normalizedEmail,
        password: hashedPassword,
      },
    });

    // Email opcional (não depende de campos inexistentes no schema)
    await sendEmail(
      normalizedEmail,
      "Bem-vindo(a) à nossa loja",
      `<p>Olá ${user.nome},</p><p>Sua conta foi criada com sucesso. Agora você já pode fazer login.</p>`
    );

    await auditLog({
      acao: "USER_REGISTER",
      usuarioId: user.id,
      ip,
      userAgent,
      meta: { email: normalizedEmail },
    });

    return { usuario: safeUser(user) };
  },

  async activateAccount(token, { ip, userAgent } = {}) {
    // O schema.prisma não possui campos de "ativação".
    // Mantemos a rota para compatibilidade com o frontend (retorna sucesso).
    await auditLog({
      acao: "USER_ACTIVATE_ROUTE_HIT",
      usuarioId: null,
      ip,
      userAgent,
      meta: { hasToken: !!token },
    });
    return { ok: true };
  },

  async login({ email, senha }, { redis, ip, userAgent } = {}) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail || !senha) throw new Error("Email e senha são obrigatórios");

    const user = await prisma.usuario.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      await auditLog({
        acao: "LOGIN_FAIL",
        usuarioId: null,
        ip,
        userAgent,
        meta: { email: normalizedEmail, reason: "USER_NOT_FOUND" },
      });
      throw new Error("Credenciais inválidas");
    }

    const ok = await bcrypt.compare(senha, user.password);
    if (!ok) {
      await auditLog({
        acao: "LOGIN_FAIL",
        usuarioId: user.id,
        ip,
        userAgent,
        meta: { reason: "BAD_PASSWORD" },
      });
      throw new Error("Credenciais inválidas");
    }

    const accessToken = signAccessToken({ id: user.id, ehAdmin: !!user.ehAdmin });
    const refreshToken = signRefreshToken({
      id: user.id,
      jti: newJti(),
      typ: "refresh",
    });

    await saveRefreshToken(redis, user.id, refreshToken);

    await auditLog({
      acao: "LOGIN_SUCCESS",
      usuarioId: user.id,
      ip,
      userAgent,
    });

    return {
      accessToken,
      refreshToken,
      usuario: safeUser(user),
    };
  },

  async refresh(refreshToken, { redis, ip, userAgent } = {}) {
    if (!refreshToken) throw new Error("Refresh token não enviado");

    const decoded = verifyRefreshToken(refreshToken);
    if (decoded.typ !== "refresh") throw new Error("Refresh token inválido");

    const userId = decoded.id;
    const storedHash = await getRefreshTokenHash(redis, userId);
    if (!storedHash) throw new Error("Refresh token inválido");

    const incomingHash = hashToken(refreshToken);
    if (storedHash !== incomingHash) throw new Error("Refresh token inválido");

    const user = await prisma.usuario.findUnique({ where: { id: Number(userId) } });
    if (!user) throw new Error("Refresh token inválido");

    const accessToken = signAccessToken({ id: userId, ehAdmin: !!user.ehAdmin });

    await auditLog({
      acao: "REFRESH_ACCESS_TOKEN",
      usuarioId: userId,
      ip,
      userAgent,
    });

    return { accessToken };
  },

  async logout(userId, { redis, ip, userAgent } = {}) {
    if (!userId) return;
    await deleteRefreshToken(redis, userId);
    await auditLog({ acao: "LOGOUT", usuarioId: userId, ip, userAgent });
  },

  async requestPasswordReset(email, { ip, userAgent } = {}) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) throw new Error("Email é obrigatório");

    const user = await prisma.usuario.findUnique({ where: { email: normalizedEmail } });

    // resposta sempre "ok" pra não vazar se email existe
    if (!user) {
      await auditLog({
        acao: "PASSWORD_RESET_REQUEST",
        usuarioId: null,
        ip,
        userAgent,
        meta: { email: normalizedEmail, result: "NO_USER" },
      });
      return;
    }

    const token = signPasswordResetToken(user.id);
    const link = `${env.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await sendEmail(
      normalizedEmail,
      "Redefinição de senha",
      `<p>Olá ${user.nome},</p><p>Para redefinir sua senha, clique:</p><p><a href="${link}">${link}</a></p><p>Este link expira em 15 minutos.</p>`
    );

    await auditLog({
      acao: "PASSWORD_RESET_REQUEST",
      usuarioId: user.id,
      ip,
      userAgent,
    });
  },

  async resetPassword({ token, senha }, { ip, userAgent } = {}) {
    if (!token || !senha) throw new Error("Token e senha são obrigatórios");
    const decoded = verifyPasswordResetToken(token);
    const userId = Number(decoded.id);
    const user = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!user) throw new Error("Token inválido ou expirado");

    const hashedPassword = await bcrypt.hash(senha, 12);
    await prisma.usuario.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    await auditLog({
      acao: "PASSWORD_RESET_SUCCESS",
      usuarioId: user.id,
      ip,
      userAgent,
    });
  },
};

export default authService;
