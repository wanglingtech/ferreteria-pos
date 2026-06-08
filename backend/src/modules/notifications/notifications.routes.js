const express = require("express");
const notificationsController = require("./notifications.controller");
const {
  authenticate,
  authorizeRoles,
} = require("../../shared/middlewares/auth.middleware");

const router = express.Router();

router.get("/", authenticate, notificationsController.listar);
router.patch("/:id/read", authenticate, notificationsController.marcarLeida);
router.patch(
  "/read-all",
  authenticate,
  notificationsController.marcarTodasLeidas,
);
router.delete("/:id", authenticate, notificationsController.eliminar);
router.post(
  "/delete-many",
  authenticate,
  notificationsController.eliminarMultiples,
);
router.delete("/", authenticate, notificationsController.eliminarTodas);

module.exports = router;
