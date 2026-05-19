const reportesRepository = require('./reportes.repository');

async function obtenerReporte() {
  return reportesRepository.getReporteGeneral();
}

module.exports = {
  obtenerReporte,
};
