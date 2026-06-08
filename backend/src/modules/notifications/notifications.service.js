const notificationsRepository = require("./notifications.repository");
const { AppError } = require("../../shared/errors/AppError");

async function listarNotificaciones() {
  return notificationsRepository.findAll();
}

async function crearNotificacion(data) {
  return notificationsRepository.create(data);
}

async function marcarComoLeida(id) {
  const notif = await notificationsRepository.findById(id);
  if (!notif) throw new AppError("Notificación no encontrada", 404);
  return notificationsRepository.markAsRead(id, true);
}

async function marcarTodasComoLeidas() {
  return notificationsRepository.markAllAsRead();
}

async function eliminarNotificacion(id) {
  return notificationsRepository.deleteById(id);
}

async function eliminarNotificaciones(ids) {
  return notificationsRepository.deleteMany(ids);
}

async function eliminarTodas() {
  return notificationsRepository.deleteAll();
}

module.exports = {
  listarNotificaciones,
  crearNotificacion,
  marcarComoLeida,
  marcarTodasComoLeidas,
  eliminarNotificacion,
  eliminarNotificaciones,
  eliminarTodas,
};
