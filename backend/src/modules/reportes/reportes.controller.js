const reportesService = require("./reportes.service");
const { asyncHandler } = require("../../shared/utils/async-handler");
const { sendSuccess } = require("../../shared/utils/http-response");

const resumen = asyncHandler(async (req, res) => {
  const data = await reportesService.obtenerReporte({
    from: req.query.from,
    to: req.query.to,
  });
  return sendSuccess(res, data, "Reporte general");
});

// ✅ Nuevo endpoint
const ventasPorDia = asyncHandler(async (req, res) => {
  const data = await reportesService.obtenerVentasPorDia({
    from: req.query.from,
    to: req.query.to,
  });
  return sendSuccess(res, data, "Ventas por día");
});

module.exports = {
  resumen,
  ventasPorDia,
};
