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
  ativo: true,
  ativadoEm: true,
  ultimoLoginEm: true,
  ultimoLoginIp: true,
  ultimoLoginUserAgent: true,
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
      imagem: data.imagem,
      nome: data.nome,
      sobrenome: data.sobrenome,
      sexo: data.sexo,
      celular: data.celular,
      dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : undefined,
    };

    return prisma.usuario.update({
      where: { id: Number(userId) },
      data: allowed,
      select: safeSelect,
    });
  }

  async update(id, data) {
    return prisma.usuario.update({
      where: { id: Number(id) },
      data,
      select: safeSelect,
    });
  }

  async deactivate(id) {
    return prisma.usuario.update({
      where: { id: Number(id) },
      data: { ativo: false },
      select: safeSelect,
    });
  }

  async delete(id) {
    return prisma.usuario.delete({
      where: { id: Number(id) },
      select: safeSelect,
    });
  }
}

export default new UserService();
