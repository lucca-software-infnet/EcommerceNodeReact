import authController from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import rateLimit from "../middlewares/rateLimit.middleware.js";

async function authRoutes(fastify, opts) {

  fastify.post(
    "/auth/register",
    { preHandler: rateLimit({ keyPrefix: "rl:register", maxAttempts: 10 }) },
    authController.register
  );

  fastify.get("/auth/activate", authController.activate);

  fastify.post(
    "/auth/login",
    { preHandler: rateLimit({ keyPrefix: "rl:login", maxAttempts: 10 }) },
    authController.login
  );

  fastify.post("/auth/refresh", authController.refresh);

  fastify.post(
    "/auth/password/forgot",
    { preHandler: rateLimit({ keyPrefix: "rl:forgot", maxAttempts: 10 }) },
    authController.requestPassword
  );

  fastify.post(
    "/auth/password/reset",
    { preHandler: rateLimit({ keyPrefix: "rl:reset", maxAttempts: 10 }) },
    authController.resetPassword
  );

  fastify.post(
    "/auth/logout",
    { preHandler: authMiddleware },
    authController.logout
  );
}

export default authRoutes;
