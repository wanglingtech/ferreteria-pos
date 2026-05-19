const { prisma } = require('../../config/database');

async function findByIdentifier(identifier) {
  return prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase() },
        { username: identifier },
      ],
    },
  });
}

async function findProfileById(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
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
  findByIdentifier,
  findProfileById,
};
