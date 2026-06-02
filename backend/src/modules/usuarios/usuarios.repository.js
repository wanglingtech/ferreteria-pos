const { prisma } = require("../../config/database");

async function findAll() {
  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

async function findByUsernameOrEmail(username, email, excludeId = null) {
  return prisma.user.findFirst({
    where: {
      OR: [{ username }, { email: email.toLowerCase() }],
      ...(excludeId && { NOT: { id: excludeId } }),
    },
    select: { id: true },
  });
}

async function create(data) {
  return prisma.user.create({
    data,
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

async function updateStatus(id, isActive) {
  return prisma.user.update({
    where: { id },
    data: { isActive },
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

// ✅ NUEVO: Actualizar datos de usuario
async function updateUser(id, data) {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

async function findById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
    },
  });
}

module.exports = {
  findAll,
  findByUsernameOrEmail,
  create,
  updateStatus,
  updateUser,
  findById,
};
