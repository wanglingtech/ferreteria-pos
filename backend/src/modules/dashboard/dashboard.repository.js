const { prisma } = require("../../config/database");

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
      where: { createdAt: { gte: start, lt: end } },
      select: { total: true },
    }),
    prisma.sale.count({
      where: { createdAt: { gte: start, lt: end } },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { stock: true, minStock: true },
    }),
  ]);
  const ingresosDia = salesToday.reduce(
    (acc, sale) => acc + Number(sale.total),
    0,
  );
  const lowStockProducts = stockSnapshot.filter(
    (p) => p.stock > 0 && p.stock <= (p.minStock || 5),
  ).length;
  return {
    ventasDia: ingresosDia,
    ordenesDia: totalOrders,
    productosTotales: products,
    productosStockBajo: lowStockProducts,
  };
}

async function getSalesLast7Days() {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 6);
  startDate.setHours(0, 0, 0, 0);
  const sales = await prisma.sale.groupBy({
    by: ["createdAt"],
    where: { createdAt: { gte: startDate } },
    _sum: { total: true },
  });
  const grouped = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const key = d.toISOString().split("T")[0];
    grouped[key] = 0;
  }
  sales.forEach((sale) => {
    const key = sale.createdAt.toISOString().split("T")[0];
    if (grouped[key] !== undefined) grouped[key] += Number(sale._sum.total);
  });
  return Object.entries(grouped).map(([date, total]) => ({ date, total }));
}

async function getTopProducts(limit = 5) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const items = await prisma.saleItem.groupBy({
    by: ["productId"],
    where: { sale: { createdAt: { gte: thirtyDaysAgo } } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });
  return items.map((item) => {
    const prod = products.find((p) => p.id === item.productId);
    return { name: prod?.name || "Producto", quantity: item._sum.quantity };
  });
}

async function getRecentActivity() {
  return prisma.sale.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      seller: { select: { fullName: true } },
      items: {
        take: 1,
        select: { quantity: true, product: { select: { name: true } } },
      },
    },
  });
}

// ✅ Incluye imageUrl
async function getLowStockAlerts(limit = 5) {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      minStock: true,
      imageUrl: true,
    },
    orderBy: { stock: "asc" },
    take: limit,
  });
  return products.filter((p) => p.stock <= (p.minStock || 5));
}

module.exports = {
  getKpis,
  getSalesLast7Days,
  getTopProducts,
  getRecentActivity,
  getLowStockAlerts,
};
