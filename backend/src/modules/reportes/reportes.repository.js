async function getReporteGeneral() {
  return {
    ventasTotales: 0,
    totalOrdenes: 0,
    ticketPromedio: 0,
    clientesAtendidos: 0,
  };
}

module.exports = {
  getReporteGeneral,
};
