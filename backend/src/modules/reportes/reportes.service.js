const reportesRepository = require("./reportes.repository");
const { AppError } = require("../../shared/errors/AppError");

async function obtenerReporte(filters) {
  const parsed = parseDateRange(filters);
  return reportesRepository.getReporteGeneral(parsed);
}

// ✅ Nueva función
async function obtenerVentasPorDia(filters) {
  const parsed = parseDateRange(filters);
  return reportesRepository.getSalesByDayRange(parsed);
}

module.exports = {
  obtenerReporte,
  obtenerVentasPorDia,
};

function parseDateRange(filters = {}) {
  const from = filters.from ? new Date(filters.from) : null;
  const to = filters.to ? new Date(filters.to) : null;

  if (from && isNaN(from.getTime())) {
    throw new AppError(
      "El parámetro from no tiene un formato de fecha válido",
      400,
    );
  }
  if (to && isNaN(to.getTime())) {
    throw new AppError(
      "El parámetro to no tiene un formato de fecha válido",
      400,
    );
  }
  if (from && to && from >= to) {
    throw new AppError("El parámetro from debe ser menor que to", 400);
  }
  return { from, to };
}
