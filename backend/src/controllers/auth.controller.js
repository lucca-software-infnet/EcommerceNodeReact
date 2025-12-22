import authService from "../services/auth.service.js"

class AuthController {

  async register(req, reply) {
    try {
      const { email, senha } = req.body

      const result = await authService.register(email, senha)

      return reply.code(201).send({
        msg: "Usuário registrado. Verifique seu e-mail",
        usuario: result
      })

    } catch (err) {
      return reply.code(400).send({ erro: err.message })
    }
  }

  async login(req, reply) {
    try {
      const { email, senha } = req.body

      const tokens = await authService.login(email, senha)

      return reply.send(tokens)

    } catch (err) {
      return reply.code(401).send({ erro: err.message })
    }
  }

  async refresh(req, reply) {
    try {
      const { refreshToken } = req.body

      const tokens = await authService.refresh(refreshToken)

      return reply.send(tokens)

    } catch (err) {
      return reply.code(400).send({ erro: err.message })
    }
  }

  async requestPassword(req, reply) {
    try {
      const { email } = req.body

      await authService.requestPasswordReset(email)

      return reply.send({ msg: "Email enviado com link de redefinição" })

    } catch (err) {
      return reply.code(400).send({ erro: err.message })
    }
  }

  async resetPassword(req, reply) {
    try {
      const { token, senha } = req.body

      await authService.resetPassword(token, senha)

      return reply.send({ msg: "Senha atualizada" })

    } catch (err) {
      return reply.code(400).send({ erro: err.message })
    }
  }

  async logout(req, reply) {
    try {
      const { refreshToken } = req.body

      await authService.logout(refreshToken)

      return reply.send({ msg: "Logout realizado" })

    } catch (err) {
      return reply.code(400).send({ erro: err.message })
    }
  }
}

export default new AuthController()
