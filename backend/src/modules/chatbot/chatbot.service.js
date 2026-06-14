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
  { patterns: [/ayuda/i, /help/i, /qué puedes hacer/i], action: "help" },
  {
    patterns: [
      /gráfico ventas/i,
      /grafico ventas/i,
      /evolución ventas/i,
      /ventas por día/i,
    ],
    action: "getSalesChart",
  },
  {
    patterns: [/top vendedores/i, /ranking vendedores/i, /mejores vendedores/i],
    action: "getTopSellers",
  },
  {
    patterns: [/stock bajo/i, /productos bajo stock/i, /inventario crítico/i],
    action: "getLowStockProducts",
  },
  {
    patterns: [
      /notificaciones no leídas/i,
      /notificaciones pendientes/i,
      /mis notificaciones/i,
    ],
    action: "getUnreadNotifications",
  },
  {
    patterns: [/exportar reporte/i, /descargar reporte/i, /reporte csv/i],
    action: "getExportReportLink",
  },
  {
    patterns: [/sugerencias/i, /qué puedo hacer/i, /opciones/i],
    action: "getQuickSuggestions",
  },
  {
    patterns: [/ventas última semana/i, /ventas últimos 7 días/i],
    action: "getLastWeekSales",
  },
];

// ========== ACCIONES EXISTENTES (no cambian) ==========
async function getSaleByCode(code) {
  const sale = await prisma.sale.findFirst({
    where: { code: { contains: code, mode: "insensitive" } },
    include: { seller: true, items: { include: { product: true } } },
  });
  if (!sale) return { text: `No encontré ninguna venta con código "${code}".` };
  return {
    text: `✅ **Venta ${sale.code}**\n📅 Fecha: ${sale.createdAt.toLocaleDateString()}\n👤 Cliente: ${sale.customerName || "Consumidor Final"}\n💵 Total: S/ ${sale.total.toFixed(2)}\n🛒 Productos: ${sale.items.length} ítems.`,
    saleData: sale,
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
    text: "🤖 Puedo ayudarte con:\n- Buscar venta (ej: 'venta V-20260608-12345')\n- Buscar cliente ('cliente Juan')\n- Top productos ('productos más vendidos')\n- Resumen ventas ('reporte general')\n- Gráfico de ventas ('gráfico ventas')\n- Ranking vendedores ('top vendedores')\n- Bajo stock ('stock bajo')\n- Notificaciones ('notificaciones no leídas')\n- Exportar reporte ('exportar reporte')\n- Sugerencias ('sugerencias')",
  };
}

// ========== NUEVAS FUNCIONALIDADES ==========
async function getSalesChart() {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  const salesByDay = await prisma.sale.groupBy({
    by: ["createdAt"],
    where: { createdAt: { gte: sevenDaysAgo, lte: today } },
    _sum: { total: true },
    orderBy: { createdAt: "asc" },
  });
  const dailyMap = new Map();
  salesByDay.forEach((s) => {
    const dateStr = s.createdAt.toISOString().split("T")[0];
    dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + Number(s._sum.total));
  });
  const labels = [];
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    labels.push(dateStr.slice(5)); // "MM-DD"
    data.push(dailyMap.get(dateStr) || 0);
  }
  return {
    type: "chart",
    chartType: "line",
    title: "📈 Ventas últimos 7 días (S/.)",
    labels,
    data,
    backgroundColor: "rgba(10, 26, 92, 0.2)",
    borderColor: "#0a1a5c",
  };
}

async function getTopSellers() {
  const sellers = await prisma.sale.groupBy({
    by: ["sellerId"],
    _sum: { total: true },
    orderBy: { _sum: { total: "desc" } },
    take: 5,
  });
  if (sellers.length === 0) return { text: "No hay ventas registradas aún." };
  const userIds = sellers.map((s) => s.sellerId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, fullName: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u.fullName]));
  const rankingText = sellers
    .map(
      (s, idx) =>
        `${idx + 1}. ${userMap.get(s.sellerId) || "Desconocido"} – S/ ${Number(s._sum.total).toFixed(2)}`,
    )
    .join("\n");
  return { text: `🏆 **Top Vendedores por monto vendido:**\n${rankingText}` };
}

async function getLowStockProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { name: true, sku: true, stock: true, minStock: true },
  });
  const lowStock = products.filter((p) => p.stock <= (p.minStock || 5));
  if (lowStock.length === 0)
    return { text: "✅ No hay productos con bajo stock." };
  const list = lowStock
    .slice(0, 10)
    .map(
      (p) =>
        `• ${p.name} (SKU: ${p.sku}) – Stock: ${p.stock} / Mín: ${p.minStock || 5}`,
    )
    .join("\n");
  return {
    text: `⚠️ **Productos con bajo stock (${lowStock.length}):**\n${list}${lowStock.length > 10 ? "\n... y más." : ""}`,
  };
}

async function getUnreadNotifications(user) {
  if (!user) return { text: "⚠️ No se pudo identificar al usuario." };
  const notifications = await prisma.notification.findMany({
    where: { userId: user.sub, isRead: false },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  if (notifications.length === 0)
    return { text: "📭 No tienes notificaciones sin leer." };
  const list = notifications
    .map(
      (n) =>
        `• ${n.title}: ${n.message} (${new Date(n.createdAt).toLocaleString()})`,
    )
    .join("\n");
  return {
    text: `🔔 **Notificaciones no leídas (${notifications.length}):**\n${list}`,
  };
}

async function getExportReportLink() {
  return {
    text: "📊 Puedes descargar el reporte completo de ventas desde la pestaña 'Exportar' del módulo de reportes.",
    actions: [{ label: "Ir a Reportes", action: "go_to_reports" }],
  };
}

function getQuickSuggestions() {
  return {
    type: "suggestions",
    text: "¿Qué te gustaría hacer?",
    suggestions: [
      "gráfico ventas",
      "top vendedores",
      "stock bajo",
      "notificaciones no leídas",
      "exportar reporte",
      "ayuda",
    ],
  };
}

async function getLastWeekSales() {
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);
  const sales = await prisma.sale.findMany({
    where: { createdAt: { gte: weekAgo } },
    select: { total: true },
  });
  const total = sales.reduce((acc, s) => acc + Number(s.total), 0);
  const avg = sales.length ? total / sales.length : 0;
  return {
    text: `📆 **Ventas última semana:**\nTotal: S/ ${total.toFixed(2)}\nPromedio diario: S/ ${avg.toFixed(2)}\nNúmero de ventas: ${sales.length}`,
  };
}

// ========== PROCESADOR PRINCIPAL ==========
async function processMessage(message, user = null) {
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
          case "getSalesChart":
            return await getSalesChart();
          case "getTopSellers":
            return await getTopSellers();
          case "getLowStockProducts":
            return await getLowStockProducts();
          case "getUnreadNotifications":
            return await getUnreadNotifications(user);
          case "getExportReportLink":
            return await getExportReportLink();
          case "getQuickSuggestions":
            return getQuickSuggestions();
          case "getLastWeekSales":
            return await getLastWeekSales();
          default:
            return { text: "No entendí tu consulta. Escribe 'ayuda'." };
        }
      }
    }
  }
  return { text: "No entendí tu consulta. Escribe 'ayuda'." };
}

module.exports = { processMessage };
