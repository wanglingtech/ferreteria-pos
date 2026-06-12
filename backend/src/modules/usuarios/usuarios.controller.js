const usuariosService = require("./usuarios.service");
const { asyncHandler } = require("../../shared/utils/async-handler");
const { sendSuccess } = require("../../shared/utils/http-response");
const notificationsService = require("../notifications/notifications.service"); // ✅

const listar = asyncHandler(async (req, res) => {
  const data = await usuariosService.listarUsuarios();
  return sendSuccess(res, data, "Listado de usuarios");
});

const crear = asyncHandler(async (req, res) => {
  const data = await usuariosService.crearUsuario(req.body);
  // ✅ Notificación
  await notificationsService.crearNotificacion({
    type: "usuario_creado",
    title: "Nuevo usuario",
    message: `Se ha creado el usuario ${data.fullName} (${data.username})`,
    data: { userId: data.id, username: data.username, fullName: data.fullName },
    userId: null,
  });
  return sendSuccess(res, data, "Usuario creado", 201);
});

const cambiarEstado = asyncHandler(async (req, res) => {
  const data = await usuariosService.cambiarEstado(
    Number(req.params.id),
    req.body,
  );
  return sendSuccess(res, data, "Estado de usuario actualizado");
});

// ✅ NUEVO: Actualizar usuario
const actualizar = asyncHandler(async (req, res) => {
  const data = await usuariosService.actualizarUsuario(
    Number(req.params.id),
    req.body,
  );
  return sendSuccess(res, data, "Usuario actualizado");
});

// ✅ NUEVO: Actualizar propio perfil (sin restricciones de rol)
const actualizarOwnProfile = asyncHandler(async (req, res) => {
  const userId = req.user.sub; // userId del JWT
  const data = await usuariosService.actualizarUsuarioProfile(userId, req.body);
  return sendSuccess(res, data, "Perfil actualizado");
});

// ✅ NUEVO: Eliminar usuario (físicamente)
const eliminar = asyncHandler(async (req, res) => {
  const data = await usuariosService.eliminarUsuario(Number(req.params.id));
  return sendSuccess(res, data, "Usuario eliminado permanentemente");
});

module.exports = {
  listar,
  crear,
  cambiarEstado,
  actualizar,
  actualizarOwnProfile,
  eliminar,
};
