import { verifyAccessToken } from "../utils/jwtTokens.js";
import { prisma } from "../config/prisma.js";

export default async function authMiddleware(req, reply) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return reply.code(401).send({ erro: "Token não enviado" });

    const [, token] = authHeader.split(" ");
    if (!token) return reply.code(401).send({ erro: "Token não enviado" });

    const decoded = verifyAccessToken(token);
    const userId = Number(decoded?.id);
    if (!Number.isFinite(userId)) {
      return reply.code(401).send({ erro: "Token inválido" });
    }

    // Padronização do projeto: req.user.id
    req.user = { id: userId, ehAdmin: !!decoded?.ehAdmin };

    // Garante que o usuário existe e está apto (evita token válido para conta inativa)
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true, ativo: true, emailVerificado: true },
    });
    if (!user) {
      return reply.code(401).send({ erro: "Token inválido" });
    }
    if (!user.emailVerificado || !user.ativo) {
      return reply.code(403).send({ erro: "Conta não ativada" });
    }

    // Bloqueio/ban (sem mudar schema): flag no Redis
    const redis = req.server?.redis;
    if (redis?.isOpen) {
      const disabled = await redis.get(`user:disabled:${userId}`);
      if (disabled) {
        return reply.code(403).send({ erro: "Conta desativada" });
      }
    }
  } catch (_err) {
    return reply.code(401).send({ erro: "Token inválido" });
  }
}
