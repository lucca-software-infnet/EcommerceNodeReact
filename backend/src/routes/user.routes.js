import userController from "../controllers/user.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

async function userRoutes(fastify, opts) {

  fastify.get("/users/me", { preHandler: authMiddleware }, userController.getMe);

  fastify.put("/users/me", { preHandler: authMiddleware }, userController.updateMe);

  // admin / suporte
  fastify.get("/users", { preHandler: authMiddleware }, userController.getAll);

  fastify.get("/users/:id", { preHandler: authMiddleware }, userController.getById);

  fastify.put("/users/:id", { preHandler: authMiddleware }, userController.update);

  fastify.patch(
    "/users/:id/desativar",
    { preHandler: authMiddleware },
    userController.deactivate
  );

  fastify.delete("/users/:id", { preHandler: authMiddleware }, userController.delete);
}

export default userRoutes;
