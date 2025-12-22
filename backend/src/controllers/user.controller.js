import userService from "../services/user.service.js"

class UserController {

  async getAll(req, reply) {
    try {
      const usuarios = await userService.getAll()
      return reply.send(usuarios)

    } catch (err) {
      return reply.code(500).send({ erro: err.message })
    }
  }

  async getById(req, reply) {
    try {
      const { id } = req.params

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

      const usuario = await userService.update(id, req.body)

      return reply.send(usuario)

    } catch (err) {
      return reply.code(400).send({ erro: err.message })
    }
  }

  async deactivate(req, reply) {
    try {
      const { id } = req.params

      await userService.deactivate(id)

      return reply.send({ msg: "Usuário desativado" })

    } catch (err) {
      return reply.code(400).send({ erro: err.message })
    }
  }

  async delete(req, reply) {
    try {
      const { id } = req.params

      await userService.delete(id)

      return reply.send({ msg: "Usuário excluído" })

    } catch (err) {
      return reply.code(400).send({ erro: err.message })
    }
  }
}

export default new UserController()
