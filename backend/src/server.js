import Fastify from "fastify";
import dotenv from "dotenv";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";

import { env } from "./config/env.js";
import { redis } from "./config/redis.js";
import { prisma } from "./config/prisma.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";

import errorMiddleware from "./middlewares/error.middleware.js";

dotenv.config();

const app = Fastify({ logger: true });

// Conexões
try {
  if (env.redisUrl) await redis.connect();
} catch (err) {
  app.log.error({ err }, "Falha ao conectar no Redis");
}

app.decorate("redis", redis);

// Plugins
await app.register(helmet);
await app.register(cookie);
await app.register(cors, {
  origin: env.frontendUrl,
  credentials: true,
});

// Healthcheck
app.get("/health", async () => ({ ok: true }));

// Rotas
app.register(authRoutes, { prefix: "/api" });
app.register(userRoutes, { prefix: "/api" });

// Erro global
app.setErrorHandler(errorMiddleware);

// graceful shutdown
app.addHook("onClose", async () => {
  try {
    await prisma.$disconnect();
  } catch {}
  try {
    if (redis?.isOpen) await redis.quit();
  } catch {}
});

// Iniciar servidor
const start = async () => {
  try {
    await app.listen({ port: env.port, host: "0.0.0.0" });
    app.log.info(`Servidor rodando na porta ${env.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
