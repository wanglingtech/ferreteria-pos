const inventarioService = require("./inventario.service");
const { asyncHandler } = require("../../shared/utils/async-handler");
const { sendSuccess } = require("../../shared/utils/http-response");

/**
 * GET /api/v1/inventario/resumen
 */
const resumen = asyncHandler(async (req, res) => {
  const data = await inventarioService.obtenerResumen();
  return sendSuccess(res, data, "Resumen de inventario");
});

/**
 * GET /api/v1/inventario/productos-criticos?search=...
 */
const productosCriticos = asyncHandler(async (req, res) => {
  const search = req.query.search || "";
  const data = await inventarioService.obtenerProductosCriticos(search);
  return sendSuccess(res, data, "Productos críticos");
});

module.exports = {
  resumen,
  productosCriticos,
};
