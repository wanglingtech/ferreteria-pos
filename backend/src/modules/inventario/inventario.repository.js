async function getResumenInventario() {
  return {
    totalProductos: 0,
    productosStockBajo: 0,
    productosSinStock: 0,
    valorizacionTotal: 0,
  };
}

module.exports = {
  getResumenInventario,
};
