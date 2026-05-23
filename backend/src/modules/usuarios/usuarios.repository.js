const { prisma } = require('../../config/database');

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
    orderBy: {
      createdAt: 'desc',
    },
  });
}

async function findByUsernameOrEmail(username, email) {
  return prisma.user.findFirst({
    where: {
      OR: [{ username }, { email: email.toLowerCase() }],
    },
    select: {
      id: true,
    },
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

module.exports = {
  findAll,
  findByUsernameOrEmail,
  create,
  updateStatus,
};
