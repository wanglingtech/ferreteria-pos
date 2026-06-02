const { prisma } = require("../../config/database");

async function findAll(soloActivas = false) {
  return prisma.category.findMany({
    where: soloActivas ? { isActive: true } : {},
    orderBy: { name: "asc" },
  });
}

async function findByName(name) {
  return prisma.category.findFirst({ where: { name } });
}

async function create(name) {
  return prisma.category.create({ data: { name } });
}

async function update(id, data) {
  return prisma.category.update({
    where: { id },
    data: {
      ...(data.nombre && { name: data.nombre }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
}

async function remove(id) {
  return prisma.category.update({ where: { id }, data: { isActive: false } });
}

module.exports = { findAll, findByName, create, update, remove };
