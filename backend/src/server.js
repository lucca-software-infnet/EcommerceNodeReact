import Fastify from "fastify";

import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { env } from "./config/env.js";
import { redis } from "./config/redis.js";
import { prisma } from "./config/prisma.js";

import routes from "./routes/index.js";

import errorMiddleware from "./middlewares/error.middleware.js";
import authMiddleware from "./middlewares/auth.middleware.js";

/* =========================
   FASTIFY INSTANCE
========================= */
const app = Fastify({ logger: true });

/* =========================
   PATHS (ESM SAFE)
========================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================
   UPLOAD DIRS
========================= */
const uploadBase = path.resolve(__dirname, "..", "uploads");
const userUpload = path.join(uploadBase, "users");
const productUpload = path.join(uploadBase, "products");

[userUpload, productUpload].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/* =========================
   DECORATORS
========================= */
app.decorate("redis", redis);
app.decorate("prisma", prisma);
// compatibilidade com rotas antigas
app.decorate("authenticate", authMiddleware);

/* =========================
   REDIS CONNECT (best-effort)
========================= */
try {
  if (redis && !redis.isOpen) {
    await redis.connect();
  }
} catch (err) {
  // Redis é opcional (rate-limit / flags). Não derruba o boot.
  app.log.warn({ err }, "Redis indisponível - seguindo sem cache/rate-limit");
}

/* =========================
   PLUGINS
========================= */
await app.register(helmet);

await app.register(cookie);

await app.register(cors, {
  // Em dev é comum alternar entre localhost/127.0.0.1.
  // Mantemos allowlist simples e com credenciais habilitadas para cookies httpOnly.
  origin: [env.frontendUrl, "http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
});

await app.register(multipart, {
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});

await app.register(fastifyStatic, {
  root: uploadBase,
  prefix: "/uploads/",
});

/* =========================
   SECURITY HEADERS
========================= */
app.addHook("onSend", async (_req, reply) => {
  reply.header("X-Content-Type-Options", "nosniff");
});

/* =========================
   HEALTHCHECK
========================= */
app.get("/health", async () => ({ ok: true }));

/* =========================
   ROUTES
========================= */
app.register(routes, { prefix: "/api" });

/* =========================
   GLOBAL ERROR HANDLER
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
    if (redis?.isOpen) {
      await redis.quit();
    }
  } catch {}
});

/* =========================
   START SERVER
========================= */
const start = async () => {
  try {
    await app.listen({
      port: env.port,
      host: "0.0.0.0",
    });

    app.log.info(`🚀 Servidor rodando na porta ${env.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
