import bcrypt from "bcrypt";
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
    const updateData = {
      imagem: data.imagem,
      nome: data.nome,
      sobrenome: data.sobrenome,
      email: data.email ? String(data.email).trim().toLowerCase() : undefined,
      ehAdmin: typeof data.ehAdmin === "boolean" ? data.ehAdmin : undefined,
      cpf: data.cpf ?? undefined,
      sexo: data.sexo,
      celular: data.celular,
      dataNascimento: data.dataNascimento
        ? new Date(data.dataNascimento)
        : undefined,
    };

    // suporte opcional a atualização de senha por admin
    if (data.senha || data.password) {
      const raw = String(data.senha || data.password);
      updateData.password = await bcrypt.hash(raw, 12);
    }

    return prisma.usuario.update({
      where: { id: Number(id) },
      data: updateData,
      select: safeSelect,
    });
  }

  async deactivate(id) {
    // Sem campo "ativo" no schema: desativação via anonimização + invalidar credenciais
    const numericId = Number(id);
    const newEmail = `deactivated+${numericId}+${Date.now()}@example.invalid`;
    const randomSecret = `${numericId}:${Date.now()}:${Math.random()}`;
    const newPasswordHash = await bcrypt.hash(randomSecret, 12);

    return prisma.usuario.update({
      where: { id: numericId },
      data: {
        email: newEmail,
        password: newPasswordHash,
        imagem: null,
        nome: "Desativado",
        sobrenome: null,
        cpf: null,
        sexo: null,
        celular: null,
        dataNascimento: null,
      },
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
