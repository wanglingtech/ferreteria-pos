const notificationsService = require("./notifications.service");
const { asyncHandler } = require("../../shared/utils/async-handler");
const { sendSuccess } = require("../../shared/utils/http-response");

const listar = asyncHandler(async (req, res) => {
  const data = await notificationsService.listarNotificaciones();
  return sendSuccess(res, data, "Notificaciones obtenidas");
});

const marcarLeida = asyncHandler(async (req, res) => {
  const data = await notificationsService.marcarComoLeida(
    Number(req.params.id),
  );
  return sendSuccess(res, data, "Notificación marcada como leída");
});

const marcarTodasLeidas = asyncHandler(async (req, res) => {
  const data = await notificationsService.marcarTodasComoLeidas();
  return sendSuccess(
    res,
    data,
    "Todas las notificaciones marcadas como leídas",
  );
});

const eliminar = asyncHandler(async (req, res) => {
  const data = await notificationsService.eliminarNotificacion(
    Number(req.params.id),
  );
  return sendSuccess(res, data, "Notificación eliminada");
});

const eliminarMultiples = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) throw new AppError("Lista de IDs requerida", 400);
  const data = await notificationsService.eliminarNotificaciones(ids);
  return sendSuccess(res, data, "Notificaciones eliminadas");
});

const eliminarTodas = asyncHandler(async (req, res) => {
  const data = await notificationsService.eliminarTodas();
  return sendSuccess(res, data, "Todas las notificaciones eliminadas");
});

module.exports = {
  listar,
  marcarLeida,
  marcarTodasLeidas,
  eliminar,
  eliminarMultiples,
  eliminarTodas,
};
