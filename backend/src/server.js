import Fastify from "fastify";

import dotenv from "dotenv";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";

import path from "path";
import fs from "fs";

import { env } from "./config/env.js";
import { redis } from "./config/redis.js";
import { prisma } from "./config/prisma.js";

import routes from "./routes/index.js";

import errorMiddleware from "./middlewares/error.middleware.js";
import authMiddleware from "./middlewares/auth.middleware.js";

dotenv.config();

const app = Fastify({ logger: true });

/* =========================
   CRIA PASTAS DE UPLOAD
========================= */
const uploadBase = path.resolve("uploads");
const userUpload = path.join(uploadBase, "users");
const productUpload = path.join(uploadBase, "products");

[userUpload, productUpload].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/* =========================
   CONEXÕES
========================= */
try {
  if (env.redisUrl) await redis.connect();
} catch (err) {
  app.log.error({ err }, "Falha ao conectar no Redis");
}

app.decorate("redis", redis);
app.decorate("prisma", prisma);
// compat: algumas rotas antigas usam app.authenticate
app.decorate("authenticate", authMiddleware);

/* =========================
   PLUGINS
========================= */
await app.register(helmet);
await app.register(cookie);
await app.register(cors, {
  origin: env.frontendUrl,
  credentials: true,
});

// upload multipart
await app.register(multipart, {
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

// servir arquivos estáticos
await app.register(fastifyStatic, {
  root: uploadBase,
  prefix: "/uploads/"
});

// hardening headers
app.addHook("onSend", async (_req, reply) => {
  reply.header("X-Content-Type-Options", "nosniff");
});
/* =========================
   HEALTHCHECK
========================= */
app.get("/health", async () => ({ ok: true }));

/* =========================
   ROTAS
========================= */
app.register(routes, { prefix: "/api" });


/* =========================
   ERRO GLOBAL
========================= */
app.setErrorHandler(errorMiddleware);

/* =========================
   GRACEFUL SHUTDOWN
========================= */
app.addHook("onClose", async () => {
  try {
    await prisma.$disconnect();
  } catch {}
  try {
    if (redis?.isOpen) await redis.quit();
  } catch {}
});

/* =========================
   START
========================= */
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
