import bcrypt from "bcrypt";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { auditLog } from "./audit.service.js";
import { generateCryptoToken, hashToken } from "./crypto.service.js";
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

function activationEnabled(redis) {
  return !!(redis && redis.isOpen);
}

async function isActivated(redis, userId) {
  if (!activationEnabled(redis)) return true; // sem redis: não bloqueia login
  const v = await redis.get(`user:activated:${userId}`);
  // compat: se não existe (usuários antigos), considera ativo
  if (v == null) return true;
  return v === "1";
}

async function setActivated(redis, userId, value) {
  if (!activationEnabled(redis)) return;
  await redis.set(`user:activated:${userId}`, value ? "1" : "0");
}

async function createOneTimeToken(redis, keyPrefix, userId, ttlSeconds) {
  const token = generateCryptoToken();
  const tokenHash = hashToken(token);
  if (redis?.isOpen) {
    await redis.set(`${keyPrefix}:${tokenHash}`, String(userId), { EX: ttlSeconds });
  }
  return token;
}

async function consumeOneTimeToken(redis, keyPrefix, token) {
  if (!redis?.isOpen) return null;
  const tokenHash = hashToken(token);
  const key = `${keyPrefix}:${tokenHash}`;
  const userId = await redis.get(key);
  if (!userId) return null;
  await redis.del(key);
  return Number(userId);
}

const authService = {
  async register(
    { email, senha, nome = "Usuário", sobrenome = null },
    { redis, ip, userAgent } = {}
  ) {
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

    const activationRequired = activationEnabled(redis);
    let activationToken = null;

    if (activationRequired) {
      // conta começa "não ativada" via Redis (sem mudar schema)
      await setActivated(redis, user.id, false);
      activationToken = await createOneTimeToken(redis, "activate", user.id, 60 * 60 * 24);

      const link = `${env.frontendUrl}/activate?token=${activationToken}`;
      await sendEmail(
        normalizedEmail,
        "Ative sua conta",
        `<p>Olá ${user.nome},</p><p>Para ativar sua conta, clique no link:</p><p><a href="${link}">${link}</a></p>`
      );
    } else {
      // sem redis/email: não bloqueia o fluxo
      await sendEmail(
        normalizedEmail,
        "Bem-vindo(a)!",
        `<p>Olá ${user.nome},</p><p>Sua conta foi criada com sucesso.</p>`
      );
    }

    await auditLog({
      acao: "USER_REGISTER",
      usuarioId: user.id,
      ip,
      userAgent,
      meta: { email: normalizedEmail },
    });

    return {
      usuario: safeUser(user),
      activationRequired,
      // útil para dev quando email não está configurado (transporter null imprime no console)
      ...(activationToken ? { activationToken } : {}),
    };
  },

  async activateAccount(token, { redis, ip, userAgent } = {}) {
    if (!token) throw new Error("Token de ativação inválido");
    if (!activationEnabled(redis)) {
      // Sem Redis não existe estado de ativação; não bloqueamos login
      return { usuario: null };
    }

    const userId = await consumeOneTimeToken(redis, "activate", token);
    if (!userId) throw new Error("Token inválido ou expirado");

    await setActivated(redis, userId, true);

    const updated = await prisma.usuario.findUnique({ where: { id: Number(userId) } });
    if (!updated) throw new Error("Usuário não encontrado");

    await auditLog({
      acao: "USER_ACTIVATED",
      usuarioId: updated.id,
      ip,
      userAgent,
    });

    return { usuario: safeUser(updated) };
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

    // bloqueio por desativação (sem schema)
    if (redis?.isOpen) {
      const disabled = await redis.get(`user:disabled:${user.id}`);
      if (disabled) throw new Error("Conta desativada");
    }

    // ativação via Redis (se habilitada)
    const activated = await isActivated(redis, user.id);
    if (!activated) {
      await auditLog({
        acao: "LOGIN_FAIL",
        usuarioId: user.id,
        ip,
        userAgent,
        meta: { reason: "NOT_ACTIVE" },
      });
      throw new Error("Conta não ativada");
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

  async requestPasswordReset(email, { redis, ip, userAgent } = {}) {
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

    if (!redis?.isOpen) {
      // sem redis não temos onde guardar o token de reset sem mudar schema
      await auditLog({
        acao: "PASSWORD_RESET_REQUEST",
        usuarioId: user.id,
        ip,
        userAgent,
        meta: { email: normalizedEmail, result: "REDIS_OFF" },
      });
      return;
    }

    const token = await createOneTimeToken(redis, "pwdreset", user.id, 60 * 15);

    const link = `${env.frontendUrl}/reset-password?token=${token}`;
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

  async resetPassword({ token, senha }, { redis, ip, userAgent } = {}) {
    if (!token || !senha) throw new Error("Token e senha são obrigatórios");
    if (!redis?.isOpen) throw new Error("Recurso indisponível (Redis não configurado)");

    const userId = await consumeOneTimeToken(redis, "pwdreset", token);
    if (!userId) throw new Error("Token inválido ou expirado");

    const hashedPassword = await bcrypt.hash(senha, 12);
    await prisma.usuario.update({
      where: { id: Number(userId) },
      data: {
        password: hashedPassword,
      },
    });

    await auditLog({
      acao: "PASSWORD_RESET_SUCCESS",
      usuarioId: userId,
      ip,
      userAgent,
    });
  },
};

export default authService;
