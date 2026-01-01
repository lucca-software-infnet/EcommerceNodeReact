import authService from "../services/auth.service.js";
import { env } from "../config/env.js";

function getContext(req) {
  return {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };
}

class AuthController {
  async register(req, reply) {
    try {
      const { email, senha, nome, sobrenome } = req.body || {};
      const result = await authService.register(
        { email, senha, nome, sobrenome },
        {
          redis: req.server.redis,
          ...getContext(req),
        }
      );

      return reply.code(201).send({
        msg: result?.activationRequired
          ? "Usuário registrado. Verifique seu e-mail para ativar a conta."
          : "Usuário registrado com sucesso.",
        ...result,
      });
    } catch (err) {
      return reply.code(400).send({ erro: err.message });
    }
  }

  async activate(req, reply) {
    try {
      const token = req.query?.token;
      const result = await authService.activateAccount(token, {
        redis: req.server.redis,
        ...getContext(req),
      });
      return reply.send({ msg: "Conta ativada com sucesso", ...result });
    } catch (err) {
      return reply.code(400).send({ erro: err.message });
    }
  }

  async login(req, reply) {
    try {
      const { email, senha } = req.body || {};
      const { accessToken, refreshToken, usuario } = await authService.login(
        { email, senha },
        {
          redis: req.server.redis,
          ...getContext(req),
        }
      );

      // refresh token em cookie httpOnly (mais robusto)
      reply.setCookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: env.cookieSecure,
        sameSite: "lax",
        path: "/api/auth/refresh",
        maxAge: 60 * 60 * 24 * 7,
      });

      return reply.send({ accessToken, usuario });
    } catch (err) {
      return reply.code(401).send({ erro: err.message });
    }
  }

  async refresh(req, reply) {
    try {
      const refreshToken = req.cookies?.refreshToken || null;
      const result = await authService.refresh(refreshToken, {
        redis: req.server.redis,
        ...getContext(req),
      });

      // Se o serviço rotacionar o refresh token, atualiza o cookie httpOnly
      if (result?.refreshToken) {
        reply.setCookie("refreshToken", result.refreshToken, {
          httpOnly: true,
          secure: env.cookieSecure,
          sameSite: "lax",
          path: "/api/auth/refresh",
          maxAge: 60 * 60 * 24 * 7,
        });
      }

      return reply.send({ accessToken: result?.accessToken });
    } catch (err) {
      // token inválido/ausente: limpa cookie para evitar retries inúteis
      reply.clearCookie("refreshToken", { path: "/api/auth/refresh" });
      return reply.code(401).send({ erro: err.message });
    }
  }

  async requestPassword(req, reply) {
    try {
      const { email } = req.body || {};
      await authService.requestPasswordReset(email, {
        redis: req.server.redis,
        ...getContext(req),
      });
      return reply.send({
        msg: "Se o e-mail existir, enviaremos um link de redefinição.",
      });
    } catch (err) {
      return reply.code(400).send({ erro: err.message });
    }
  }

  async resetPassword(req, reply) {
    try {
      const { token, senha } = req.body || {};
      await authService.resetPassword(
        { token, senha },
        { redis: req.server.redis, ...getContext(req) }
      );
      return reply.send({ msg: "Senha atualizada" });
    } catch (err) {
      return reply.code(400).send({ erro: err.message });
    }
  }

  async logout(req, reply) {
    try {
      const userId = req.user?.id;
      await authService.logout(userId, {
        redis: req.server.redis,
        ...getContext(req),
      });

      reply.clearCookie("refreshToken", { path: "/api/auth/refresh" });
      return reply.send({ msg: "Logout realizado" });
    } catch (err) {
      return reply.code(400).send({ erro: err.message });
    }
  }
}

export default new AuthController();
