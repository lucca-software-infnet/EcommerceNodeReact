import userService from "../services/user.service.js"

class UserController {

  async getAll(req, reply) {
    try {
      if (!req.user?.ehAdmin) {
        return reply.code(403).send({ erro: "Acesso negado" })
      }
      const usuarios = await userService.getAll()
      return reply.send(usuarios)

    } catch (err) {
      return reply.code(500).send({ erro: err.message })
    }
  }

  async getMe(req, reply) {
    try {
      const usuario = await userService.getMe(req.user.userId)
      return reply.send(usuario)
    } catch (err) {
      return reply.code(400).send({ erro: err.message })
    }
  }

  async getById(req, reply) {
    try {
      const { id } = req.params
      const numericId = Number(id)

      if (!req.user?.ehAdmin && req.user?.userId !== numericId) {
        return reply.code(403).send({ erro: "Acesso negado" })
      }

      const usuario = await userService.getById(id)

      if (!usuario)
        return reply.code(404).send({ erro: "Usuário não encontrado" })

      return reply.send(usuario)

    } catch (err) {
      return reply.code(400).send({ erro: err.message })
    }
  }

  async update(req, reply) {
    try {
      const { id } = req.params
      const numericId = Number(id)

      const usuario =
        !req.user?.ehAdmin && req.user?.userId === numericId
          ? await userService.updateMe(req.user.userId, req.body || {})
          : req.user?.ehAdmin
            ? await userService.update(id, req.body || {})
            : null

      if (!usuario) return reply.code(403).send({ erro: "Acesso negado" })

      return reply.send(usuario)

    } catch (err) {
      return reply.code(400).send({ erro: err.message })
    }
  }

  async updateMe(req, reply) {
    try {
      const usuario = await userService.updateMe(req.user.userId, req.body || {})
      return reply.send(usuario)
    } catch (err) {
      return reply.code(400).send({ erro: err.message })
    }
  }

  async deactivate(req, reply) {
    try {
      const { id } = req.params

      if (!req.user?.ehAdmin) {
        return reply.code(403).send({ erro: "Acesso negado" })
      }

      await userService.deactivate(id)

      return reply.send({ msg: "Usuário desativado" })

    } catch (err) {
      return reply.code(400).send({ erro: err.message })
    }
  }

  async delete(req, reply) {
    try {
      const { id } = req.params

      if (!req.user?.ehAdmin) {
        return reply.code(403).send({ erro: "Acesso negado" })
      }

      await userService.delete(id)

      return reply.send({ msg: "Usuário excluído" })

    } catch (err) {
      return reply.code(400).send({ erro: err.message })
    }
  }
}

export default new UserController()
