const { prisma } = require("../../config/database");

// Lista de patrones y acciones
const intents = [
  {
    patterns: [
      /venta\s*(\w+)/i,
      /detalles? de venta\s*(\w+)/i,
      /mostrar venta\s*(\w+)/i,
    ],
    action: "getSaleByCode",
  },
  {
    patterns: [/cliente\s*(.+)/i, /buscar cliente\s*(.+)/i, /quién es\s*(.+)/i],
    action: "getCustomerByName",
  },
  {
    patterns: [
      /productos? más vendidos?/i,
      /top productos/i,
      /mejores productos/i,
    ],
    action: "getTopProducts",
  },
  {
    patterns: [/ventas? totales?/i, /resumen ventas/i, /reporte general/i],
    action: "getSalesSummary",
  },
  {
    patterns: [/ayuda/i, /help/i, /qué puedes hacer/i],
    action: "help",
  },
];

// Acciones
async function getSaleByCode(code) {
  const sale = await prisma.sale.findFirst({
    where: { code: { contains: code, mode: "insensitive" } },
    include: { seller: true, items: { include: { product: true } } },
  });
  if (!sale) return { text: `No encontré ninguna venta con código "${code}".` };
  return {
    text: `✅ **Venta ${sale.code}**\n📅 Fecha: ${sale.createdAt.toLocaleDateString()}\n👤 Cliente: ${sale.customerName || "Consumidor Final"}\n💵 Total: S/ ${sale.total.toFixed(2)}\n🛒 Productos: ${sale.items.length} ítems.`,
    saleData: sale, // para opciones de descarga
  };
}

async function getCustomerByName(name) {
  const customers = await prisma.sale.findMany({
    where: { customerName: { contains: name, mode: "insensitive" } },
    distinct: ["customerName"],
    take: 5,
  });
  if (!customers.length)
    return { text: `No encontré clientes con nombre "${name}".` };
  const lista = customers.map((c) => c.customerName).join(", ");
  return { text: `📋 Clientes que coinciden: ${lista}` };
}

async function getTopProducts(limit = 5) {
  const top = await prisma.saleItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });
  const ids = top.map((t) => t.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
  });
  const result = top
    .map((t) => {
      const p = products.find((p) => p.id === t.productId);
      return `${p?.name} (${t._sum.quantity} unidades)`;
    })
    .join("\n");
  return { text: `🏆 **Productos más vendidos:**\n${result}` };
}

async function getSalesSummary() {
  const totalSales = await prisma.sale.count();
  const totalRevenue = await prisma.sale.aggregate({ _sum: { total: true } });
  return {
    text: `📊 **Resumen de ventas:**\nTotal de ventas: ${totalSales}\nIngresos totales: S/ ${totalRevenue._sum.total?.toFixed(2) || 0}`,
  };
}

async function help() {
  return {
    text: "🤖 Puedo ayudarte con:\n- Buscar venta (ej: 'venta V-20260608-12345')\n- Buscar cliente ('cliente Juan')\n- Top productos ('productos más vendidos')\n- Resumen ventas ('reporte general')\n- Generar PDF/imagen de una venta específica.",
  };
}

// Función principal
async function processMessage(message) {
  for (const intent of intents) {
    for (const pattern of intent.patterns) {
      const match = message.match(pattern);
      if (match) {
        const param = match[1] || null;
        switch (intent.action) {
          case "getSaleByCode":
            return await getSaleByCode(param);
          case "getCustomerByName":
            return await getCustomerByName(param);
          case "getTopProducts":
            return await getTopProducts();
          case "getSalesSummary":
            return await getSalesSummary();
          case "help":
            return await help();
          default:
            return { text: "No entendí tu consulta. Escribe 'ayuda'." };
        }
      }
    }
  }
  return { text: "No entendí tu consulta. Escribe 'ayuda'." };
}

module.exports = { processMessage };
