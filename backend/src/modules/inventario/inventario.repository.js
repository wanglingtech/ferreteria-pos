const { prisma } = require("../../config/database");

/**
 * Obtiene resumen de inventario con KPIs corregidos
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

  // ✅ CORRECCIÓN: stock bajo = stock > 0 Y stock <= minStock (si minStock > 0)
  // Si minStock es 0, consideramos stock bajo cuando stock > 0 y stock <= 5 (valor por defecto razonable)
  const productosStockBajo = products.filter((p) => {
    if (p.stock <= 0) return false;
    const limite = p.minStock > 0 ? p.minStock : 5; // umbral por defecto 5
    return p.stock <= limite;
  }).length;

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
 * Obtiene productos críticos (stock <= minStock o stock <= 5 si minStock=0)
 * Incluye imagen del producto
 */
async function getProductosCriticos(searchTerm = "") {
  // Condición: stock > 0 y stock <= minStock (o <=5 si minStock=0)
  // También incluimos sin stock (stock <= 0) como críticos
  const where = {
    isActive: true,
    OR: [
      { stock: { lte: 0 } }, // sin stock
      {
        stock: { gt: 0 },
        AND: [{ stock: { lte: prisma.product.fields.minStock } }],
      },
    ],
  };

  // Si el campo minStock es 0 en muchos productos, usamos un valor por defecto en la consulta SQL?
  // Como no podemos usar lógica condicional fácilmente, filtramos en JS después.
  // Pero para rendimiento, traemos todos los productos activos y luego filtramos.
  // Ajuste: traemos todos los productos activos (sin filtrar por stock) y aplicamos filtro en JS.
  // Así aseguramos que se respete el umbral por defecto de 5.

  const products = await prisma.product.findMany({
    where: { isActive: true },
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

  // Filtrar productos críticos según lógica
  let filtered = products.filter((p) => {
    if (p.stock <= 0) return true; // sin stock siempre crítico
    const limite = p.minStock > 0 ? p.minStock : 5;
    return p.stock <= limite;
  });

  // Aplicar búsqueda si hay término
  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term),
    );
  }

  return filtered;
}

module.exports = {
  getResumenInventario,
  getProductosCriticos,
};
