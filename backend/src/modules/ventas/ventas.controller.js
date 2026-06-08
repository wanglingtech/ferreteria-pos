const ventasService = require("./ventas.service");
const { asyncHandler } = require("../../shared/utils/async-handler");
const { sendSuccess } = require("../../shared/utils/http-response");
const notificationsService = require("../notifications/notifications.service"); // ✅

const listar = asyncHandler(async (req, res) => {
  const data = await ventasService.listarVentas();
  return sendSuccess(res, data, "Listado de ventas");
});

const obtener = asyncHandler(async (req, res) => {
  const data = await ventasService.obtenerVenta(Number(req.params.id));
  return sendSuccess(res, data, "Detalle de venta");
});

const crear = asyncHandler(async (req, res) => {
  const data = await ventasService.crearVenta(req.body, req.user);
  // ✅ Notificación
  await notificationsService.crearNotificacion({
    type: "venta_registrada",
    title: "Nueva venta",
    message: `Se ha registrado la venta ${data.code} por S/ ${data.total}`,
    data: { saleId: data.id, code: data.code, total: data.total },
    userId: null,
  });
  return sendSuccess(res, data, "Venta registrada", 201);
});

module.exports = {
  listar,
  obtener,
  crear,
};
