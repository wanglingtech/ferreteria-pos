const { prisma } = require("../../config/database");

// ============================================================
// FUNCIONES EXISTENTES (no modificar)
// ============================================================
async function getReporteGeneral(filters = {}) {
  const where = buildDateWhere(filters);
  const [sales, totalOrdenes, customers, topProductsRaw] = await Promise.all([
    prisma.sale.findMany({
      where,
      select: { subtotal: true, igv: true, total: true },
    }),
    prisma.sale.count({ where }),
    prisma.sale.count({ where: { ...where, customerName: { not: null } } }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);
  const totalVentas = Number(
    sales.reduce((acc, s) => acc + Number(s.total), 0).toFixed(2),
  );
  const ticketPromedio =
    totalOrdenes > 0 ? Number((totalVentas / totalOrdenes).toFixed(2)) : 0;
  const totalIgv = Number(
    sales.reduce((acc, s) => acc + Number(s.igv), 0).toFixed(2),
  );
  const totalSubtotal = Number(
    sales.reduce((acc, s) => acc + Number(s.subtotal), 0).toFixed(2),
  );

  const productIds = topProductsRaw.map((item) => item.productId);
  const productMap = new Map();
  if (productIds.length) {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, sku: true, name: true },
    });
    products.forEach((p) => productMap.set(p.id, p));
  }
  const topProductos = topProductsRaw.map((item) => ({
    productId: item.productId,
    sku: productMap.get(item.productId)?.sku || null,
    nombre: productMap.get(item.productId)?.name || "Producto no encontrado",
    cantidadVendida: item._sum.quantity || 0,
    totalVendido: Number(item._sum.lineTotal || 0),
  }));
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

async function getSalesByDayRange(filters = {}) {
  const where = buildDateWhere(filters);
  const salesByDay = await prisma.sale.groupBy({
    by: ["createdAt"],
    where,
    _sum: { total: true },
    orderBy: { createdAt: "asc" },
  });
  return salesByDay.map((item) => ({
    date: item.createdAt.toISOString().split("T")[0],
    total: Number(item._sum.total),
  }));
}

function buildDateWhere(filters) {
  const where = {};
  if (filters.from || filters.to) where.createdAt = {};
  if (filters.from) where.createdAt.gte = filters.from;
  if (filters.to) where.createdAt.lt = filters.to;
  return where;
}

// ============================================================
// ✅ NUEVA FUNCIÓN: Ventas paginadas con búsqueda
// ============================================================
async function getSalesPaginated(filters = {}) {
  const { from, to, search, page = 1, pageSize = 10 } = filters;
  const where = buildDateWhere({ from, to });
  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { code: { contains: term, mode: "insensitive" } },
      { customerName: { contains: term, mode: "insensitive" } },
      { seller: { fullName: { contains: term, mode: "insensitive" } } },
    ];
  }
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        seller: { select: { id: true, fullName: true, username: true } },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, imageUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.sale.count({ where }),
  ]);
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

module.exports = { getReporteGeneral, getSalesByDayRange, getSalesPaginated };
