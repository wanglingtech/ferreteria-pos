const { prisma } = require("../../config/database");

async function findAll(where = {}) {
  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

async function findById(id) {
  return prisma.notification.findUnique({ where: { id } });
}

async function create(data) {
  return prisma.notification.create({ data });
}

async function markAsRead(id, isRead = true) {
  return prisma.notification.update({ where: { id }, data: { isRead } });
}

async function markAllAsRead() {
  return prisma.notification.updateMany({
    where: { isRead: false },
    data: { isRead: true },
  });
}

async function deleteById(id) {
  return prisma.notification.delete({ where: { id } });
}

async function deleteMany(ids) {
  return prisma.notification.deleteMany({ where: { id: { in: ids } } });
}

async function deleteAll() {
  return prisma.notification.deleteMany({});
}

module.exports = {
  findAll,
  findById,
  create,
  markAsRead,
  markAllAsRead,
  deleteById,
  deleteMany,
  deleteAll,
};
