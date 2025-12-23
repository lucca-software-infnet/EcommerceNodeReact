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

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import produtoRoutes from "./routes/produto.routes.js";
import checkoutRoutes from "./routes/checkout.routes.js";
import pedidosRoutes from "./routes/pedidos.routes.js";
import vendasRoutes from "./routes/vendas.routes.js";
import pagamentoRoutes from "./routes/pagamento.routes.js";

import errorMiddleware from "./middlewares/error.middleware.js";

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

await app.register(fastifyStatic, {
  root: path.resolve("uploads"),
  prefix: "/uploads/",
  decorateReply: false,
  setHeaders(res) {
    res.setHeader("X-Content-Type-Options", "nosniff");
  }
});




/* =========================
   HEALTHCHECK
========================= */
app.get("/health", async () => ({ ok: true }));

/* =========================
   ROTAS
========================= */
app.register(authRoutes, { prefix: "/api" });
app.register(userRoutes, { prefix: "/api" });
app.register(produtoRoutes, { prefix: "/api" });
app.register(checkoutRoutes, { prefix: "/api" });
app.register(pedidosRoutes, { prefix: "/api" });
app.register(vendasRoutes, { prefix: "/api" });
app.register(pagamentoRoutes, { prefix: "/api" });


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
