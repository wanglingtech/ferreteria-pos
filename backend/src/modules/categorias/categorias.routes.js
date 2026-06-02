const express = require("express");
const categoriasController = require("./categorias.controller");
const {
  authenticate,
  authorizeRoles,
} = require("../../shared/middlewares/auth.middleware");

const router = express.Router();

router.get("/", authenticate, categoriasController.listar);
router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  categoriasController.crear,
);
router.patch(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  categoriasController.actualizar,
);
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  categoriasController.eliminar,
);

module.exports = router;
