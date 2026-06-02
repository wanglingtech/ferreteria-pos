const express = require("express");
const usuariosController = require("./usuarios.controller");
const {
  authenticate,
  authorizeRoles,
} = require("../../shared/middlewares/auth.middleware");

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  usuariosController.listar,
);
router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  usuariosController.crear,
);
router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("ADMIN"),
  usuariosController.cambiarEstado,
);
// ✅ NUEVA RUTA: Actualizar usuario (solo ADMIN)
router.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  usuariosController.actualizar,
);

module.exports = router;
