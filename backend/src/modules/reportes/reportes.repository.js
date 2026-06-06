const { prisma } = require("../../config/database");

async function getReporteGeneral(filters = {}) {
  const where = buildDateWhere(filters);

  const [sales, totalOrdenes, customers, topProductsRaw] = await Promise.all([
    prisma.sale.findMany({
      where,
      select: { subtotal: true, igv: true, total: true },
    }),
    prisma.sale.count({ where }),
    prisma.sale.count({
      where: { ...where, customerName: { not: null } },
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const totalVentas = Number(
    sales.reduce((acc, sale) => acc + Number(sale.total), 0).toFixed(2),
  );
  const ticketPromedio =
    totalOrdenes > 0 ? Number((totalVentas / totalOrdenes).toFixed(2)) : 0;
  const totalIgv = Number(
    sales.reduce((acc, sale) => acc + Number(sale.igv), 0).toFixed(2),
  );
  const totalSubtotal = Number(
    sales.reduce((acc, sale) => acc + Number(sale.subtotal), 0).toFixed(2),
  );

  const productIds = topProductsRaw.map((item) => item.productId);
  const productMap = new Map();
  if (productIds.length > 0) {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, sku: true, name: true },
    });
    products.forEach((p) => productMap.set(p.id, p));
  }

  const topProductos = topProductsRaw.map((item) => {
    const product = productMap.get(item.productId);
    return {
      productId: item.productId,
      sku: product?.sku || null,
      nombre: product?.name || "Producto no encontrado",
      cantidadVendida: item._sum.quantity || 0,
      totalVendido: Number(item._sum.lineTotal || 0),
    };
  });

  return {
    ventasTotales: totalVentas,
    subtotalTotal: totalSubtotal,
    igvTotal: totalIgv,
    totalOrdenes,
    ticketPromedio,
    clientesAtendidos: customers,
    topProductos,
  };
}

// ✅ NUEVA FUNCIÓN: ventas agrupadas por día en el rango
async function getSalesByDayRange(filters = {}) {
  const where = buildDateWhere(filters);
  // Agrupar por fecha (sin horas)
  const salesByDay = await prisma.sale.groupBy({
    by: ["createdAt"],
    where,
    _sum: { total: true },
    orderBy: { createdAt: "asc" },
  });

  // Convertir a formato { date: 'YYYY-MM-DD', total: number }
  const result = salesByDay.map((item) => ({
    date: item.createdAt.toISOString().split("T")[0],
    total: Number(item._sum.total),
  }));
  return result;
}

function buildDateWhere(filters) {
  const where = {};
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = filters.from;
    if (filters.to) where.createdAt.lt = filters.to;
  }
  return where;
}

module.exports = {
  getReporteGeneral,
  getSalesByDayRange,
};
