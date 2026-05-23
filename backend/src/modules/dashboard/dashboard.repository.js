const { prisma } = require('../../config/database');

function getDayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

async function getKpis() {
  const { start, end } = getDayRange();

  const [salesToday, totalOrders, products, stockSnapshot] = await Promise.all([
    prisma.sale.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      select: {
        total: true,
      },
    }),
    prisma.sale.count({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    }),
    prisma.product.count({
      where: { isActive: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        stock: true,
        minStock: true,
      },
    }),
  ]);

  const ingresosDia = salesToday.reduce((acc, sale) => acc + Number(sale.total), 0);
  const lowStockProducts = stockSnapshot.filter(
    (product) => product.stock > 0 && product.stock <= product.minStock,
  ).length;

  return {
    ventasDia: ingresosDia,
    ordenesDia: totalOrders,
    productosTotales: products,
    productosStockBajo: lowStockProducts,
    ingresosDia,
  };
}

module.exports = {
  getKpis,
};
