import authService from "../services/auth.service.js";
import { env } from "../config/env.js";
import { REFRESH_TOKEN_TTL_SECONDS } from "../utils/jwtTokens.js";

function getContext(req) {
  return {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };
}

function getRefreshCookieOptions() {
  // Se for cross-site com HTTPS, precisamos SameSite=None.
  // Em dev (proxy /api) normalmente é first-party e "lax" funciona bem.
  const sameSite = env.cookieSecure ? "none" : "lax";
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite,
    // Disponibiliza o refresh cookie para todos endpoints de auth,
    // permitindo logout revogar o token atual do dispositivo.
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  };
}

class AuthController {
  async register(req, reply) {
    try {
      // Padronização do projeto: "senha" no payload.
      // Compatibilidade: aceita "password" caso algum client ainda use esse nome.
      const { email, senha, password, nome, sobrenome } = req.body || {};
      const senhaFinal = senha ?? password;
      const result = await authService.register(
        { email, senha: senhaFinal, nome, sobrenome },
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
      // Padronização do projeto: "senha" no payload.
      // Compatibilidade: aceita "password" caso algum client ainda use esse nome.
      const { email, senha, password } = req.body || {};
      const senhaFinal = senha ?? password;
      const { accessToken, refreshToken, usuario } = await authService.login(
        { email, senha: senhaFinal },
        {
          redis: req.server.redis,
          ...getContext(req),
        }
      );

      // refresh token em cookie httpOnly (mais robusto)
      reply.setCookie("refreshToken", refreshToken, {
        ...getRefreshCookieOptions(),
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
          ...getRefreshCookieOptions(),
        });
      }

      return reply.send({ accessToken: result?.accessToken });
    } catch (err) {
      // token inválido/ausente: limpa cookie para evitar retries inúteis
      reply.clearCookie("refreshToken", { path: "/api/auth" });
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
      // Padronização do projeto: "senha" no payload.
      // Compatibilidade: aceita "password" caso algum client ainda use esse nome.
      const { token, senha, password } = req.body || {};
      const senhaFinal = senha ?? password;
      await authService.resetPassword(
        { token, senha: senhaFinal },
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
      const refreshToken = req.cookies?.refreshToken || null;
      await authService.logout(userId, {
        refreshToken,
        redis: req.server.redis,
        ...getContext(req),
      });

      reply.clearCookie("refreshToken", { path: "/api/auth" });
      return reply.send({ msg: "Logout realizado" });
    } catch (err) {
      return reply.code(400).send({ erro: err.message });
    }
  }
}

export default new AuthController();
