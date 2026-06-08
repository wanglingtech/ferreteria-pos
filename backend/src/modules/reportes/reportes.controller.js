const reportesService = require("./reportes.service");
const { asyncHandler } = require("../../shared/utils/async-handler");
const { sendSuccess } = require("../../shared/utils/http-response");
const notificationsService = require("../notifications/notifications.service"); // ✅

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

const registrarExportacion = asyncHandler(async (req, res) => {
  const { tipo, desde, hasta } = req.body; // tipo: 'CSV' o 'PDF'
  const usuario = req.user; // viene del middleware authenticate
  await notificationsService.crearNotificacion({
    type: "reporte_exportado",
    title: "Reporte exportado",
    message: `El usuario ${usuario.fullName} exportó un reporte de ventas en formato ${tipo} (${desde} al ${hasta})`,
    data: { tipo, desde, hasta, usuarioId: usuario.sub },
    userId: null,
  });
  return sendSuccess(res, null, "Exportación registrada");
});

module.exports = {
  resumen,
  ventasPorDia,
  registrarExportacion,
};
