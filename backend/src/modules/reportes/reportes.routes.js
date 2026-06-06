const express = require("express");
const reportesController = require("./reportes.controller");
const { authenticate } = require("../../shared/middlewares/auth.middleware");

const router = express.Router();

router.get("/resumen", authenticate, reportesController.resumen);
router.get("/ventas-por-dia", authenticate, reportesController.ventasPorDia); // ✅

module.exports = router;
