import { verifyAccessToken } from "../utils/jwtTokens.js";

export default async function authMiddleware(req, reply) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return reply.code(401).send({ erro: "Token não enviado" });

    const [, token] = authHeader.split(" ");
    if (!token) return reply.code(401).send({ erro: "Token não enviado" });

    const decoded = verifyAccessToken(token);
    req.user = { userId: decoded.id, ehAdmin: !!decoded.ehAdmin };
  } catch (_err) {
    return reply.code(401).send({ erro: "Token inválido" });
  }
}
