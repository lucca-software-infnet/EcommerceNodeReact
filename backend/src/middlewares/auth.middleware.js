import { verifyAccessToken } from "../utils/jwtTokens.js";

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
