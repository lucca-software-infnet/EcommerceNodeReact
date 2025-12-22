import userController from "../controllers/user.controller.js"
import authMiddleware from "../middlewares/auth.middleware.js"

async function userRoutes(fastify, opts) {

  fastify.get(
    "/usuarios",
    { preHandler: authMiddleware },
    userController.getAll
  )

  fastify.get(
    "/usuarios/:id",
    { preHandler: authMiddleware },
    userController.getById
  )

  fastify.put(
    "/usuarios/:id",
    { preHandler: authMiddleware },
    userController.update
  )

  fastify.patch(
    "/usuarios/:id/desativar",
    { preHandler: authMiddleware },
    userController.deactivate
  )

  fastify.delete(
    "/usuarios/:id",
    { preHandler: authMiddleware },
    userController.delete
  )
}

export default userRoutes
