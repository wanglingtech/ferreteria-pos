const { prisma } = require("../../config/database");

/**
 * Obtiene resumen de inventario: total productos activos, stock bajo, sin stock y valorización
 */
async function getResumenInventario() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      stock: true,
      minStock: true,
      price: true,
    },
  });

  const totalProductos = products.length;
  const productosSinStock = products.filter((p) => p.stock <= 0).length;
  const productosStockBajo = products.filter(
    (p) => p.stock > 0 && p.stock <= p.minStock,
  ).length;
  const valorizacionTotal = products.reduce(
    (acc, p) => acc + Number(p.price) * p.stock,
    0,
  );

  return {
    totalProductos,
    productosStockBajo,
    productosSinStock,
    valorizacionTotal,
  };
}

/**
 * Obtiene lista de productos críticos (stock <= minStock) con datos completos para mostrar alertas
 */
async function getProductosCriticos(searchTerm = "") {
  const where = {
    isActive: true,
    stock: { lte: prisma.product.fields.minStock }, // stock <= minStock
  };

  if (searchTerm && searchTerm.trim()) {
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { sku: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  return prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      minStock: true,
      imageUrl: true,
      category: { select: { name: true } },
    },
    orderBy: [{ stock: "asc" }, { name: "asc" }],
  });
}

module.exports = {
  getResumenInventario,
  getProductosCriticos,
};
