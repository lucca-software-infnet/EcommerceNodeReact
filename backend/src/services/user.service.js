import prisma from "../config/prisma.js"

class UserService {

  async getAll() {
    return prisma.usuario.findMany()
  }

  async getById(id) {
    return prisma.usuario.findUnique({
      where: { id: Number(id) }
    })
  }

  async update(id, data) {
    return prisma.usuario.update({
      where: { id: Number(id) }
    })
  }

  async delete(id) {
    return prisma.usuario.delete({
      where: { id: Number(id) }
    })
  }

  async deactivate(id) {
    return prisma.usuario.update({
      where: { id: Number(id) }
    })
  }
}

export default new UserService()
