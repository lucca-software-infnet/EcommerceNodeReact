import path from "path";
import userService from "../services/user.service.js";
import { saveImage } from "../utils/uploadImage.js";

class UserController {

  async getAll(req, reply) {
    try {
      if (!req.user?.ehAdmin) {
        return reply.code(403).send({ erro: "Acesso negado" });
      }

      const usuarios = await userService.getAll();
      return reply.send(usuarios);

    } catch (err) {
      return reply.code(500).send({ erro: err.message });
    }
  }

  async getMe(req, reply) {
    try {
      const usuario = await userService.getMe(req.user.id);
      return reply.send(usuario);
    } catch (err) {
      return reply.code(400).send({ erro: err.message });
    }
  }

  async getById(req, reply) {
    try {
      const numericId = Number(req.params.id);

      if (!req.user?.ehAdmin && req.user.id !== numericId) {
        return reply.code(403).send({ erro: "Acesso negado" });
      }

      const usuario = await userService.getById(numericId);

      if (!usuario) {
        return reply.code(404).send({ erro: "Usuário não encontrado" });
      }

      return reply.send(usuario);

    } catch (err) {
      return reply.code(400).send({ erro: err.message });
    }
  }

  async update(req, reply) {
    try {
      const numericId = Number(req.params.id);

      const usuario =
        !req.user?.ehAdmin && req.user.id === numericId
          ? await userService.updateMe(req.user.id, req.body || {})
          : req.user?.ehAdmin
            ? await userService.update(numericId, req.body || {})
            : null;

      if (!usuario) {
        return reply.code(403).send({ erro: "Acesso negado" });
      }

      return reply.send(usuario);

    } catch (err) {
      return reply.code(400).send({ erro: err.message });
    }
  }

  async updateMe(req, reply) {
    try {
      const usuario = await userService.updateMe(req.user.id, req.body || {});
      return reply.send(usuario);
    } catch (err) {
      return reply.code(400).send({ erro: err.message });
    }
  }

  // 🔥 UPLOAD DE AVATAR (SEGURO)
  async uploadAvatar(req, reply) {
    try {
      const file = await req.file();
      const userId = req.user.id;

      if (!file) {
        return reply.code(400).send({ erro: "Arquivo não enviado" });
      }

      const buffer = await file.toBuffer();
      const uploadDir = path.join("uploads", "users");
      const filename = `${userId}.jpg`;

      await saveImage({
        buffer,
        uploadDir,
        filename,
        overwrite: true  // Avatar pode ser atualizado
      });

      const usuario = await userService.updateAvatar(userId, `/uploads/users/${filename}`);

      return reply.send({
        imagem: usuario.imagem
      });

    } catch (err) {
      return reply.code(400).send({ erro: err.message });
    }
  }

  async deactivate(req, reply) {
    try {
      if (!req.user?.ehAdmin) {
        return reply.code(403).send({ erro: "Acesso negado" });
      }

      await userService.deactivate(Number(req.params.id));
      return reply.send({ msg: "Usuário desativado" });

    } catch (err) {
      return reply.code(400).send({ erro: err.message });
    }
  }

  async delete(req, reply) {
    try {
      if (!req.user?.ehAdmin) {
        return reply.code(403).send({ erro: "Acesso negado" });
      }

      await userService.delete(Number(req.params.id));
      return reply.send({ msg: "Usuário excluído" });

    } catch (err) {
      return reply.code(400).send({ erro: err.message });
    }
  }
}

export default new UserController();
