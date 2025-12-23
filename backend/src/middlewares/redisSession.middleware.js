import { verifyAccessToken } from "../utils/jwtTokens.js";

export default async function redisSession(req, reply) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return reply.code(401).send({ erro: "Token não enviado" });

    const token = authHeader.split(" ")[1];
    if (!token) return reply.code(401).send({ erro: "Token não enviado" });

    const decoded = verifyAccessToken(token);

    const redis = req.server.redis;
    if (!redis || !redis.isOpen) {
      return reply.code(503).send({ erro: "Sessão indisponível (Redis offline)" });
    }

    const exists = await redis.get(`session:${decoded.id}`);

    if (!exists)
      return reply.code(401).send({ erro: "Sessão expirada ou inválida" });

    // Padronização
    req.user = { id: Number(decoded.id) };

  } catch (err) {
    return reply.code(401).send({ erro: "Sessão inválida" });
  }
}
