import { prisma } from "../config/prisma.js";

const safeSelect = {
  id: true,
  imagem: true,
  nome: true,
  sobrenome: true,
  email: true,
  ehAdmin: true,
  cpf: true,
  sexo: true,
  celular: true,
  dataNascimento: true,
  dataRegistro: true,
};

class UserService {
  async getAll() {
    return prisma.usuario.findMany({ select: safeSelect });
  }

  async getById(id) {
    return prisma.usuario.findUnique({
      where: { id: Number(id) },
      select: safeSelect,
    });
  }

  async getMe(userId) {
    return prisma.usuario.findUnique({
      where: { id: Number(userId) },
      select: safeSelect,
    });
  }

  async updateMe(userId, data) {
    const allowed = {
      nome: data.nome,
      sobrenome: data.sobrenome,
      cpf: data.cpf,
      sexo: data.sexo,
      celular: data.celular,
      dataNascimento: data.dataNascimento
        ? new Date(data.dataNascimento)
        : undefined,
    };

    return prisma.usuario.update({
      where: { id: Number(userId) },
      data: allowed,
      select: safeSelect,
    });
  }

  async updateAvatar(userId, imagem) {
    return prisma.usuario.update({
      where: { id: Number(userId) },
      data: { imagem },
      select: safeSelect,
    });
  }



  async update(id, data) {
    // admin: restringe update aos campos existentes no schema
    const allowed = {
      imagem: data.imagem,
      nome: data.nome,
      sobrenome: data.sobrenome,
      email: data.email ? String(data.email).trim().toLowerCase() : undefined,
      ehAdmin: typeof data.ehAdmin === "boolean" ? data.ehAdmin : undefined,
      cpf: data.cpf,
      sexo: data.sexo,
      celular: data.celular,
      dataNascimento: data.dataNascimento
        ? new Date(data.dataNascimento)
        : undefined,
    };

    return prisma.usuario.update({
      where: { id: Number(id) },
      data: allowed,
      select: safeSelect,
    });
  }

  // Desativação sem mudar schema: flag no Redis (consumida pelo auth.middleware)
  async deactivate(id, { redis } = {}) {
    if (!redis || !redis.isOpen) {
      throw new Error("Redis não configurado para desativação de conta");
    }
    const userId = Number(id);
    if (!Number.isFinite(userId)) throw new Error("ID inválido");
    await redis.set(`user:disabled:${userId}`, "1");
    return { id: userId, disabled: true };
  }

  async delete(id) {
    return prisma.usuario.delete({
      where: { id: Number(id) },
      select: safeSelect,
    });
  }
}

export default new UserService();
