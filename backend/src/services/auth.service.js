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
    email: user.email,
    ehAdmin: user.ehAdmin,
  };
}

const ACTIVATION_TOKEN_TTL_SECONDS = 60 * 60 * 24; // 24h
const PASSWORD_RESET_TOKEN_TTL_SECONDS = 60 * 15; // 15 min

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

    const { user, activationTokenRaw } = await prisma.$transaction(async (tx) => {
      const user = await tx.usuario.create({
        data: {
          nome,
          sobrenome,
          email: normalizedEmail,
          password: hashedPassword,
          emailVerificado: false,
          // requisito: isActive=false no registro
          ativo: false,
        },
      });

      // invalida tokens anteriores não usados (se houver)
      await tx.activationToken.updateMany({
        where: { usuarioId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      const activationTokenRaw = generateCryptoToken();
      const activationTokenHash = hashToken(activationTokenRaw);

      await tx.activationToken.create({
        data: {
          tokenHash: activationTokenHash,
          expiresAt: new Date(Date.now() + ACTIVATION_TOKEN_TTL_SECONDS * 1000),
          usuarioId: user.id,
        },
      });

      return { user, activationTokenRaw };
    });

    const link = `${env.frontendUrl}/activate?token=${activationTokenRaw}`;

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

    await auditLog({
      acao: "USER_REGISTER",
      usuarioId: user.id,
      ip,
      userAgent,
    });

    return {
      usuario: safeUser(user),
      activationRequired: true,
    };
  },

  /**
   * ======================
   * ✅ ATIVAÇÃO DE CONTA
   * ======================
   */
  async activateAccount(token, { redis, ip, userAgent } = {}) {
    if (!token) throw new Error("Token inválido");

    const tokenHash = hashToken(String(token));

    const now = new Date();

    const activation = await prisma.activationToken.findUnique({
      where: { tokenHash },
    });

    if (!activation || activation.usedAt) {
      throw new Error("Token inválido ou expirado");
    }
    if (activation.expiresAt <= now) {
      throw new Error("Token inválido ou expirado");
    }

    const user = await prisma.$transaction(async (tx) => {
      await tx.activationToken.update({
        where: { id: activation.id },
        data: { usedAt: now },
      });

      // remove/invalida quaisquer outros tokens pendentes do usuário
      await tx.activationToken.updateMany({
        where: { usuarioId: activation.usuarioId, usedAt: null, NOT: { id: activation.id } },
        data: { usedAt: now },
      });

      return tx.usuario.update({
        where: { id: activation.usuarioId },
        data: {
          emailVerificado: true,
          ativo: true,
        },
      });
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

    const refreshJti = newJti();
    const refreshToken = signRefreshToken({
      id: user.id,
      jti: refreshJti,
      typ: "refresh",
    });

    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        jti: refreshJti,
        usuarioId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      },
    });

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

    const now = new Date();

    const tokenRow = await prisma.refreshToken.findUnique({
      where: { jti: String(decoded.jti) },
    });

    if (!tokenRow) throw new Error("Refresh token inválido");
    if (tokenRow.revokedAt) throw new Error("Refresh token inválido");
    if (tokenRow.expiresAt <= now) throw new Error("Refresh token inválido");
    if (tokenRow.usuarioId !== Number(decoded.id)) {
      throw new Error("Refresh token inválido");
    }
    if (tokenRow.tokenHash !== hashToken(refreshToken)) {
      throw new Error("Refresh token inválido");
    }

    const user = await prisma.usuario.findUnique({
      where: { id: Number(decoded.id) },
    });
    if (!user) throw new Error("Refresh token inválido");
    if (!user.emailVerificado || !user.ativo) throw new Error("Refresh token inválido");

    const accessToken = signAccessToken({
      id: user.id,
      ehAdmin: !!user.ehAdmin,
    });

    // Rotação de refresh token (mais seguro): revoga o atual e emite um novo
    const newRefreshToken = signRefreshToken({
      id: user.id,
      jti: newJti(),
      typ: "refresh",
    });
    const newRefreshDecoded = verifyRefreshToken(newRefreshToken);

    await prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: tokenRow.id },
        data: { revokedAt: now, replacedByJti: String(newRefreshDecoded.jti) },
      });

      await tx.refreshToken.create({
        data: {
          tokenHash: hashToken(newRefreshToken),
          jti: String(newRefreshDecoded.jti),
          usuarioId: user.id,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
        },
      });
    });

    await auditLog({
      acao: "REFRESH_ACCESS_TOKEN",
      usuarioId: user.id,
      ip,
      userAgent,
    });

    return { accessToken, refreshToken: newRefreshToken };
  },

  /**
   * ======================
   * 🚪 LOGOUT
   * ======================
   */
  async logout(userId, { redis, ip, userAgent } = {}) {
    if (!userId) return;
    await prisma.refreshToken.updateMany({
      where: { usuarioId: Number(userId), revokedAt: null },
      data: { revokedAt: new Date() },
    });
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

    const { rawToken } = await prisma.$transaction(async (tx) => {
      // invalida tokens anteriores não usados
      await tx.passwordResetToken.updateMany({
        where: { usuarioId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      const rawToken = generateCryptoToken();
      await tx.passwordResetToken.create({
        data: {
          tokenHash: hashToken(rawToken),
          usuarioId: user.id,
          expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_SECONDS * 1000),
        },
      });

      return { rawToken };
    });

    const link = `${env.frontendUrl}/reset-password?token=${rawToken}`;

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
    const now = new Date();

    const tokenRow = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(String(token)) },
    });
    if (!tokenRow || tokenRow.usedAt) throw new Error("Token inválido ou expirado");
    if (tokenRow.expiresAt <= now) throw new Error("Token inválido ou expirado");

    const hashedPassword = await bcrypt.hash(senha, 12);

    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.update({
        where: { id: tokenRow.id },
        data: { usedAt: now },
      });

      await tx.passwordResetToken.updateMany({
        where: { usuarioId: tokenRow.usuarioId, usedAt: null, NOT: { id: tokenRow.id } },
        data: { usedAt: now },
      });

      await tx.usuario.update({
        where: { id: tokenRow.usuarioId },
        data: { password: hashedPassword },
      });

      // padrão de e-commerce: após reset, revoga refresh tokens ativos (força novo login)
      await tx.refreshToken.updateMany({
        where: { usuarioId: tokenRow.usuarioId, revokedAt: null },
        data: { revokedAt: now },
      });
    });

    await auditLog({
      acao: "PASSWORD_RESET_SUCCESS",
      usuarioId: tokenRow.usuarioId,
      ip,
      userAgent,
    });
  },
};

export default authService;
