// backend/server.js
import Fastify from "fastify";
import dotenv from "dotenv";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { redisClient } from "./src/config/redis.js";

import authRoutes from "./src/routes/auth.routes.js";
import userRoutes from "./src/routes/user.routes.js";

import { errorMiddleware } from "./src/middlewares/error.middleware.js";
import { redisSessionMiddleware } from "./src/middlewares/redisSession.middleware.js";

dotenv.config();

const app = Fastify({
  logger: true
});

// Middlewares globais
await app.register(cors);
app.addHook("preHandler", redisSessionMiddleware);

// Rate Limit global
await app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
  redis: redisClient
});

// Registrar rotas
app.register(authRoutes, { prefix: "/usuarios" });
app.register(userRoutes, { prefix: "/usuarios" });

// Erro global
app.setErrorHandler(errorMiddleware);

// Iniciar servidor
const start = async () => {
  try {
    await app.listen({
      port: process.env.PORT || 3000,
      host: "0.0.0.0",
    });
    console.log("🔥 Servidor rodando...");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
