async function getKpis() {
  return {
    ventasDia: 0,
    ordenesDia: 0,
    productosTotales: 0,
    productosStockBajo: 0,
    ingresosDia: 0,
  };
}

module.exports = {
  getKpis,
};
