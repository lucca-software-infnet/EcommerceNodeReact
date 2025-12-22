import { env } from "../config/env.js";

// Rate-limit com Redis por IP + bloqueio por tentativas.
// Usar principalmente em endpoints sensíveis: login / reset password.
export default function rateLimit({
  windowSeconds = 60,
  maxAttempts = 10,
  blockSeconds = 15 * 60,
  keyPrefix = "rl",
} = {}) {
  return async function rateLimitHook(req, reply) {
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const redis = req.server.redis;

    if (!redis || !redis.isOpen) return; // se redis não estiver disponível, não bloqueia

    const blockKey = `${keyPrefix}:block:${ip}`;
    const counterKey = `${keyPrefix}:count:${ip}`;

    const isBlocked = await redis.get(blockKey);
    if (isBlocked) {
      return reply.code(429).send({
        erro: "IP bloqueado temporariamente por muitas tentativas",
      });
    }

    const count = await redis.incr(counterKey);
    if (count === 1) {
      await redis.expire(counterKey, windowSeconds);
    }

    if (count > maxAttempts) {
      await redis.set(blockKey, "1", { EX: blockSeconds });
      // opcional: limpa o contador para não crescer
      await redis.del(counterKey);

      return reply.code(429).send({
        erro: "Muitas tentativas. IP bloqueado temporariamente",
      });
    }

    // headers informativos
    reply.header("X-RateLimit-Limit", String(maxAttempts));
    reply.header("X-RateLimit-Window", String(windowSeconds));
    reply.header("X-RateLimit-Remaining", String(Math.max(0, maxAttempts - count)));
    reply.header("X-RateLimit-Redis", env.redisUrl ? "on" : "off");
  };
}
