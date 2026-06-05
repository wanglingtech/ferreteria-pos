const { prisma } = require("../../config/database");

async function getResumenInventario() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, stock: true, minStock: true, price: true },
  });
  const totalProductos = products.length;
  const productosSinStock = products.filter((p) => p.stock <= 0).length;
  const productosStockBajo = products.filter((p) => {
    if (p.stock <= 0) return false;
    const limite = p.minStock > 0 ? p.minStock : 5;
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

async function getProductosCriticos(searchTerm = "") {
  let products = await prisma.product.findMany({
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
  let criticos = products.filter((p) => {
    if (p.stock <= 0) return true;
    const limite = p.minStock > 0 ? p.minStock : 5;
    return p.stock <= limite;
  });
  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.trim().toLowerCase();
    criticos = criticos.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term),
    );
  }
  return criticos;
}

module.exports = { getResumenInventario, getProductosCriticos };
