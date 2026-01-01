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

/**
 * 🔒 Retorna apenas dados seguros para o frontend
 */
function safeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    nome: user.nome,
    sobrenome: user.sobrenome,
    imagem: user.imagem,
    ehAdmin: user.ehAdmin,
  };
}

/**
 * ======================
 * 🔁 REFRESH TOKEN
 * ======================
 */
async function saveRefreshToken(redis, userId, refreshToken) {
  if (!redis?.isOpen) return;
  const tokenHash = hashToken(refreshToken);
  await redis.set(`refresh:${userId}`, tokenHash, {
    EX: REFRESH_TOKEN_TTL_SECONDS,
  });
}

async function getRefreshTokenHash(redis, userId) {
  if (!redis?.isOpen) return null;
  return redis.get(`refresh:${userId}`);
}

async function deleteRefreshToken(redis, userId) {
  if (!redis?.isOpen) return;
  await redis.del(`refresh:${userId}`);
}

/**
 * ======================
 * 🔑 TOKENS DE USO ÚNICO
 * ======================
 */
async function createOneTimeToken(redis, prefix, userId, ttlSeconds) {
  if (!redis?.isOpen) return null;

  const token = generateCryptoToken();
  const tokenHash = hashToken(token);

  await redis.set(`${prefix}:${tokenHash}`, String(userId), {
    EX: ttlSeconds,
  });

  return token;
}

async function consumeOneTimeToken(redis, prefix, token) {
  if (!redis?.isOpen) return null;

  const tokenHash = hashToken(token);
  const key = `${prefix}:${tokenHash}`;
  const userId = await redis.get(key);

  if (!userId) return null;

  await redis.del(key);
  return Number(userId);
}

/**
 * ======================
 * 🧠 AUTH SERVICE
 * ======================
 */
const authService = {
  /**
   * ======================
   * 📝 REGISTER
   * ======================
   */
  async register(
    { email, senha, nome = "Usuário", sobrenome = null },
    { redis, ip, userAgent } = {}
  ) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail || !senha) {
      throw new Error("Email e senha são obrigatórios");
    }

    const exists = await prisma.usuario.findUnique({
      where: { email: normalizedEmail },
    });
    if (exists) throw new Error("Email já cadastrado");

    const hashedPassword = await bcrypt.hash(senha, 12);

    const user = await prisma.usuario.create({
      data: {
        nome,
        sobrenome,
        email: normalizedEmail,
        password: hashedPassword,
        emailVerificado: false,
        ativo: true,
      },
    });

    let activationToken = null;

    if (redis?.isOpen) {
      console.log("REDIS:", redis?.isOpen);

      activationToken = await createOneTimeToken(
        redis,
        "activate",
        user.id,
        60 * 60 * 24        
      );

      const link = `${env.frontendUrl}/activate?token=${activationToken}`;

      await sendEmail(
        normalizedEmail,
        "Ative sua conta",
        `
          <p>Olá ${user.nome},</p>
          <p>Para ativar sua conta, clique no link abaixo:</p>
          <p><a href="${link}">${link}</a></p>
          <p>Este link expira em 24 horas.</p>
        `
      );
    }

    await auditLog({
      acao: "USER_REGISTER",
      usuarioId: user.id,
      ip,
      userAgent,
    });

    return {
      usuario: safeUser(user),
      ...(activationToken ? { activationToken } : {}),
    };
  },

  /**
   * ======================
   * ✅ ATIVAÇÃO DE CONTA
   * ======================
   */
  async activateAccount(token, { redis, ip, userAgent } = {}) {
    if (!token) throw new Error("Token inválido");
    if (!redis?.isOpen) throw new Error("Ativação indisponível");

    const userId = await consumeOneTimeToken(redis, "activate", token);
    if (!userId) throw new Error("Token inválido ou expirado");

    const user = await prisma.usuario.update({
      where: { id: userId },
      data: { emailVerificado: true },
    });

    await auditLog({
      acao: "USER_ACTIVATED",
      usuarioId: user.id,
      ip,
      userAgent,
    });

    return { usuario: safeUser(user) };
  },

  /**
   * ======================
   * 🔐 LOGIN
   * ======================
   */
  async login({ email, senha }, { redis, ip, userAgent } = {}) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail || !senha) {
      throw new Error("Email e senha são obrigatórios");
    }

    const user = await prisma.usuario.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      await auditLog({
        acao: "LOGIN_FAIL",
        usuarioId: null,
        ip,
        userAgent,
        meta: { reason: "USER_NOT_FOUND" },
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

    if (!user.emailVerificado) {
      throw new Error("Ative sua conta pelo e-mail");
    }

    if (!user.ativo) {
      throw new Error("Conta desativada");
    }

    const accessToken = signAccessToken({
      id: user.id,
      ehAdmin: !!user.ehAdmin,
    });

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

  /**
   * ======================
   * 🔄 REFRESH TOKEN
   * ======================
   */
  async refresh(refreshToken, { redis, ip, userAgent } = {}) {
    if (!refreshToken) throw new Error("Refresh token não enviado");

    const decoded = verifyRefreshToken(refreshToken);
    if (decoded.typ !== "refresh") throw new Error("Refresh token inválido");

    const storedHash = await getRefreshTokenHash(redis, decoded.id);
    if (!storedHash) throw new Error("Refresh token inválido");

    if (storedHash !== hashToken(refreshToken)) {
      throw new Error("Refresh token inválido");
    }

    const user = await prisma.usuario.findUnique({
      where: { id: Number(decoded.id) },
    });
    if (!user) throw new Error("Refresh token inválido");

    const accessToken = signAccessToken({
      id: user.id,
      ehAdmin: !!user.ehAdmin,
    });

    await auditLog({
      acao: "REFRESH_ACCESS_TOKEN",
      usuarioId: user.id,
      ip,
      userAgent,
    });

    return { accessToken };
  },

  /**
   * ======================
   * 🚪 LOGOUT
   * ======================
   */
  async logout(userId, { redis, ip, userAgent } = {}) {
    if (!userId) return;
    await deleteRefreshToken(redis, userId);
    await auditLog({ acao: "LOGOUT", usuarioId: userId, ip, userAgent });
  },

  /**
   * ======================
   * 🔑 RESET DE SENHA
   * ======================
   */
  async requestPasswordReset(email, { redis, ip, userAgent } = {}) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) throw new Error("Email é obrigatório");

    const user = await prisma.usuario.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) return;

    if (!redis?.isOpen) return;

    const token = await createOneTimeToken(
      redis,
      "pwdreset",
      user.id,
      60 * 15
    );

    const link = `${env.frontendUrl}/reset-password?token=${token}`;

    await sendEmail(
      normalizedEmail,
      "Redefinição de senha",
      `
        <p>Olá ${user.nome},</p>
        <p>Clique no link para redefinir sua senha:</p>
        <p><a href="${link}">${link}</a></p>
        <p>Este link expira em 15 minutos.</p>
      `
    );
  },

  async resetPassword({ token, senha }, { redis, ip, userAgent } = {}) {
    if (!token || !senha) throw new Error("Token e senha são obrigatórios");
    if (!redis?.isOpen) throw new Error("Serviço indisponível");

    const userId = await consumeOneTimeToken(redis, "pwdreset", token);
    if (!userId) throw new Error("Token inválido ou expirado");

    const hashedPassword = await bcrypt.hash(senha, 12);

    await prisma.usuario.update({
      where: { id: userId },
      data: { password: hashedPassword },
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
