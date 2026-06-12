const reportesRepository = require("./reportes.repository");
const { AppError } = require("../../shared/errors/AppError");

async function obtenerReporte(filters) {
  const parsed = parseDateRange(filters);
  return reportesRepository.getReporteGeneral(parsed);
}

async function obtenerVentasPorDia(filters) {
  const parsed = parseDateRange(filters);
  return reportesRepository.getSalesByDayRange(parsed);
}

// ✅ Nueva función
async function obtenerVentasPaginadas(filters) {
  const { from, to, search, page, pageSize } = filters;
  const parsed = parseDateRange({ from, to });
  return reportesRepository.getSalesPaginated({
    from: parsed.from,
    to: parsed.to,
    search,
    page: page ? parseInt(page) : 1,
    pageSize: pageSize ? parseInt(pageSize) : 10,
  });
}

module.exports = {
  obtenerReporte,
  obtenerVentasPorDia,
  obtenerVentasPaginadas,
};

function parseDateRange(filters = {}) {
  const from = filters.from ? new Date(filters.from) : null;
  const to = filters.to ? new Date(filters.to) : null;
  if (from && isNaN(from.getTime()))
    throw new AppError("El parámetro from no es una fecha válida", 400);
  if (to && isNaN(to.getTime()))
    throw new AppError("El parámetro to no es una fecha válida", 400);
  if (from && to && from >= to)
    throw new AppError("El parámetro from debe ser menor que to", 400);
  return { from, to };
}
