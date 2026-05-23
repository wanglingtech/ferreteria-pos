const { prisma } = require('../../config/database');

async function findAll(filters = {}) {
  const where = {
    ...(typeof filters.isActive === 'boolean' ? { isActive: filters.isActive } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { sku: { contains: filters.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  return prisma.product.findMany({
    where,
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

async function findById(id) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

async function create(data) {
  return prisma.product.create({
    data: {
      sku: data.sku,
      name: data.nombre,
      description: data.descripcion || null,
      imageUrl: data.imagenUrl || null,
      price: data.precio,
      stock: data.stock,
      minStock: data.stockMinimo,
      categoryId: data.categoriaId || null,
    },
  });
}

async function update(id, data) {
  return prisma.product.update({
    where: { id },
    data: {
      ...(data.sku ? { sku: data.sku } : {}),
      ...(data.nombre ? { name: data.nombre } : {}),
      ...(data.descripcion !== undefined ? { description: data.descripcion } : {}),
      ...(data.imagenUrl !== undefined ? { imageUrl: data.imagenUrl } : {}),
      ...(data.precio !== undefined ? { price: data.precio } : {}),
      ...(data.stock !== undefined ? { stock: data.stock } : {}),
      ...(data.stockMinimo !== undefined ? { minStock: data.stockMinimo } : {}),
      ...(data.categoriaId !== undefined ? { categoryId: data.categoriaId } : {}),
    },
  });
}

async function remove(id) {
  return prisma.product.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
