const { prisma } = require('../../config/database');

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
  const productosSinStock = products.filter((product) => product.stock <= 0).length;
  const productosStockBajo = products.filter(
    (product) => product.stock > 0 && product.stock <= product.minStock,
  ).length;

  const valorizacionTotal = products.reduce(
    (acc, product) => acc + Number(product.price) * product.stock,
    0,
  );

  return {
    totalProductos,
    productosStockBajo,
    productosSinStock,
    valorizacionTotal,
  };
}

module.exports = {
  getResumenInventario,
};
