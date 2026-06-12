const express = require("express");
const reportesController = require("./reportes.controller");
const { authenticate } = require("../../shared/middlewares/auth.middleware");

const router = express.Router();

router.get("/resumen", authenticate, reportesController.resumen);
router.get("/ventas-por-dia", authenticate, reportesController.ventasPorDia);
router.get("/ventas", authenticate, reportesController.ventasPaginadas); // ✅ nueva
router.post("/exportar", authenticate, reportesController.registrarExportacion);

module.exports = router;
