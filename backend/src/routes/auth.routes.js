import authController from "../controllers/auth.controller.js"

async function authRoutes(fastify, opts) {

  fastify.post("/usuarios", authController.register)

  fastify.post("/usuarios/login", authController.login)

  fastify.post("/usuarios/refresh", authController.refresh)

  fastify.post("/usuarios/solicitar-senha", authController.requestPassword)

  fastify.post("/usuarios/nova-senha", authController.resetPassword)

  fastify.post("/usuarios/logout", authController.logout)
}

export default authRoutes
