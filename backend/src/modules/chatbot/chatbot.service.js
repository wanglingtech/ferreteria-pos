const { prisma } = require("../../config/database");

// ============================================================
//  VALIDACIÓN DE ENTRADA (seguridad mejorada)
// ============================================================
function sanitizeInput(input) {
  if (!input) return "";
  // Permite letras (con acentos y ñ), números, espacios, y puntuación común
  // También permite guiones, apóstrofes, puntos, paréntesis, signos de interrogación/exclamación
  return input.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9\s\-'\.()?!,;:]/g, "").trim();
}

// ============================================================
//  INTENTS (prioridad: los más específicos primero)
// ============================================================
const intents = [
  // GRÁFICO VENTAS (muy específico)
  {
    patterns: [
      /^gráfico ventas$/i,
      /^grafico ventas$/i,
      /^evolución ventas$/i,
      /^ventas por día$/i,
    ],
    action: "getSalesChart",
  },
  // TOP VENDEDORES
  {
    patterns: [
      /^top vendedores$/i,
      /^ranking vendedores$/i,
      /^mejores vendedores$/i,
    ],
    action: "getTopSellers",
  },
  // STOCK BAJO
  {
    patterns: [
      /^stock bajo$/i,
      /^productos bajo stock$/i,
      /^inventario crítico$/i,
    ],
    action: "getLowStockProducts",
  },
  // NOTIFICACIONES NO LEÍDAS
  {
    patterns: [
      /^notificaciones no leídas$/i,
      /^notificaciones pendientes$/i,
      /^mis notificaciones$/i,
    ],
    action: "getUnreadNotifications",
  },
  // EXPORTAR REPORTE
  {
    patterns: [/^exportar reporte$/i, /^descargar reporte$/i, /^reporte csv$/i],
    action: "getExportReportLink",
  },
  // SUGERENCIAS
  {
    patterns: [/^sugerencias$/i, /^qué puedo hacer$/i, /^opciones$/i],
    action: "getQuickSuggestions",
  },
  // VENTAS ÚLTIMA SEMANA
  {
    patterns: [/^ventas última semana$/i, /^ventas últimos 7 días$/i],
    action: "getLastWeekSales",
  },
  // TOP PRODUCTOS
  {
    patterns: [
      /^productos más vendidos$/i,
      /^top productos$/i,
      /^mejores productos$/i,
    ],
    action: "getTopProducts",
  },
  // RESUMEN VENTAS
  {
    patterns: [/^ventas totales$/i, /^resumen ventas$/i, /^reporte general$/i],
    action: "getSalesSummary",
  },
  // AYUDA
  {
    patterns: [/^ayuda$/i, /^help$/i, /^qué puedes hacer$/i],
    action: "help",
  },
  // BUSCAR VENTA POR CÓDIGO (general)
  {
    patterns: [
      /^venta\s+([a-zA-Z0-9\-]+)$/i,
      /^detalles? de venta\s+([a-zA-Z0-9\-]+)$/i,
      /^mostrar venta\s+([a-zA-Z0-9\-]+)$/i,
    ],
    action: "getSaleByCode",
  },
  // BUSCAR CLIENTE
  {
    patterns: [
      /^cliente\s+(.+)$/i,
      /^buscar cliente\s+(.+)$/i,
      /^quién es\s+(.+)$/i,
    ],
    action: "getCustomerByName",
  },
];

// ============================================================
//  ACCIONES (respuestas enriquecidas con HTML)
// ============================================================

async function getSaleByCode(code) {
  const sale = await prisma.sale.findFirst({
    where: { code: { contains: code, mode: "insensitive" } },
    include: { seller: true, items: { include: { product: true } } },
  });
  if (!sale) {
    return {
      text: `⚠️ No encontré ninguna venta con código <b>"${code}"</b>. Verifica que el código sea correcto.`,
    };
  }
  let itemsHtml = `<table style="width:100%; border-collapse:collapse; font-size:12px; margin-top:8px;">
    <tr style="background:#f1f5f9;"><th style="padding:4px 8px; text-align:left;">Producto</th><th style="padding:4px 8px; text-align:center;">Cant</th><th style="padding:4px 8px; text-align:right;">Precio</th><th style="padding:4px 8px; text-align:right;">Subtotal</th></tr>`;
  sale.items.forEach((item) => {
    itemsHtml += `<tr><td style="padding:4px 8px; border-bottom:1px solid #e2e8f0;">${item.product.name}</td>
      <td style="padding:4px 8px; text-align:center; border-bottom:1px solid #e2e8f0;">${item.quantity}</td>
      <td style="padding:4px 8px; text-align:right; border-bottom:1px solid #e2e8f0;">S/ ${Number(item.unitPrice).toFixed(2)}</td>
      <td style="padding:4px 8px; text-align:right; border-bottom:1px solid #e2e8f0;">S/ ${Number(item.lineTotal).toFixed(2)}</td></tr>`;
  });
  itemsHtml += `</table>`;

  const text = `<b>✅ Venta ${sale.code}</b><br>
    📅 <b>Fecha:</b> ${sale.createdAt.toLocaleDateString("es-PE")}<br>
    👤 <b>Cliente:</b> ${sale.customerName || "Consumidor Final"}<br>
    💵 <b>Total:</b> S/ ${Number(sale.total).toFixed(2)}<br>
    🛒 <b>Productos (${sale.items.length} ítems):</b><br>
    ${itemsHtml}`;
  return { text, saleData: sale };
}

async function getCustomerByName(name) {
  const customers = await prisma.sale.findMany({
    where: { customerName: { contains: name, mode: "insensitive" } },
    distinct: ["customerName"],
    take: 5,
  });
  if (!customers.length) {
    return {
      text: `⚠️ No encontré clientes con nombre <b>"${name}"</b>. Intenta con otro nombre.`,
    };
  }
  const list = customers.map((c) => `• ${c.customerName}`).join("<br>");
  return { text: `📋 <b>Clientes que coinciden con "${name}":</b><br>${list}` };
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
  const productMap = new Map(products.map((p) => [p.id, p]));
  let list = top
    .map((t, idx) => {
      const p = productMap.get(t.productId);
      return `${idx + 1}. <b>${p?.name || "Producto"}</b> – ${t._sum.quantity} unidades`;
    })
    .join("<br>");
  return { text: `🏆 <b>Productos más vendidos:</b><br>${list}` };
}

async function getSalesSummary() {
  const totalSales = await prisma.sale.count();
  const totalRevenue = await prisma.sale.aggregate({ _sum: { total: true } });
  return {
    text: `📊 <b>Resumen de ventas:</b><br>
    • Total de ventas: <b>${totalSales}</b><br>
    • Ingresos totales: <b>S/ ${Number(totalRevenue._sum.total || 0).toFixed(2)}</b>`,
  };
}

async function help() {
  return {
    text: `🤖 <b>Comandos disponibles:</b><br>
    • <b>venta [código]</b> – Muestra detalle de una venta.<br>
    • <b>cliente [nombre]</b> – Busca clientes por nombre.<br>
    • <b>productos más vendidos</b> – Top 5 productos.<br>
    • <b>reporte general</b> – Resumen de ventas.<br>
    • <b>gráfico ventas</b> – Gráfico de últimos 7 días.<br>
    • <b>top vendedores</b> – Ranking de vendedores.<br>
    • <b>stock bajo</b> – Productos con bajo inventario.<br>
    • <b>notificaciones no leídas</b> – Tus notificaciones.<br>
    • <b>exportar reporte</b> – Enlace para descargar.<br>
    • <b>sugerencias</b> – Muestra opciones rápidas.`,
  };
}

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
    labels.push(dateStr.slice(5));
    data.push(dailyMap.get(dateStr) || 0);
  }
  return {
    type: "chart",
    chartType: "line",
    title: "📈 Ventas últimos 7 días (S/.)",
    labels,
    data,
    backgroundColor: "rgba(10,26,92,0.2)",
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
  const ranking = sellers
    .map(
      (s, idx) =>
        `${idx + 1}. <b>${userMap.get(s.sellerId) || "Desconocido"}</b> – S/ ${Number(s._sum.total).toFixed(2)}`,
    )
    .join("<br>");
  return { text: `🏆 <b>Top Vendedores por monto vendido:</b><br>${ranking}` };
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
        `• <b>${p.name}</b> (SKU: ${p.sku}) – Stock: ${p.stock} / Mín: ${p.minStock || 5}`,
    )
    .join("<br>");
  return {
    text: `⚠️ <b>Productos con bajo stock (${lowStock.length}):</b><br>${list}${lowStock.length > 10 ? "<br>... y más." : ""}`,
  };
}

/**
 * ✅ CORREGIDO: Busca notificaciones no leídas del usuario Y globales (userId: null)
 */
async function getUnreadNotifications(user) {
  if (!user) return { text: "⚠️ No se pudo identificar al usuario." };
  // Buscar notificaciones no leídas del usuario o globales
  const notifications = await prisma.notification.findMany({
    where: {
      isRead: false,
      OR: [{ userId: user.sub }, { userId: null }],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  if (notifications.length === 0) {
    return { text: "📭 No tienes notificaciones sin leer." };
  }
  const list = notifications
    .map(
      (n) =>
        `• <b>${n.title}</b>: ${n.message} (${new Date(n.createdAt).toLocaleString()})`,
    )
    .join("<br>");
  return {
    text: `🔔 <b>Notificaciones no leídas (${notifications.length}):</b><br>${list}`,
  };
}

async function getExportReportLink() {
  return {
    text: "📊 Puedes descargar el reporte completo de ventas desde la pestaña <b>'Exportar'</b> del módulo de reportes.",
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
    text: `📆 <b>Ventas última semana:</b><br>
    • Total: S/ ${total.toFixed(2)}<br>
    • Promedio diario: S/ ${avg.toFixed(2)}<br>
    • Número de ventas: ${sales.length}`,
  };
}

// ============================================================
//  PROCESADOR PRINCIPAL CON VALIDACIÓN
// ============================================================
async function processMessage(message, user = null) {
  const cleanMessage = sanitizeInput(message);
  if (!cleanMessage) {
    return {
      text: "⚠️ Por favor, escribe un mensaje válido (letras, números, espacios, guiones, apóstrofes y puntos).",
    };
  }

  for (const intent of intents) {
    for (const pattern of intent.patterns) {
      const match = cleanMessage.match(pattern);
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
  return {
    text: "No entendí tu consulta. Escribe 'ayuda' para ver comandos disponibles.",
  };
}

module.exports = { processMessage };
