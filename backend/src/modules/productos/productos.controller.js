const productosService = require("./productos.service");
const { asyncHandler } = require("../../shared/utils/async-handler");
const { sendSuccess } = require("../../shared/utils/http-response");
const notificationsService = require("../notifications/notifications.service"); // ✅ única declaración

const listar = asyncHandler(async (req, res) => {
  const filters = {
    search: req.query.search?.trim() || undefined,
    categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
    isActive:
      req.query.isActive !== undefined
        ? req.query.isActive === "true"
        : undefined,
  };
  const data = await productosService.listarProductos(filters);
  return sendSuccess(res, data, "Listado de productos");
});

const obtener = asyncHandler(async (req, res) => {
  const data = await productosService.obtenerProducto(Number(req.params.id));
  return sendSuccess(res, data, "Detalle de producto");
});

const crear = asyncHandler(async (req, res) => {
  const data = await productosService.crearProducto(req.body);
  // Notificación
  await notificationsService.crearNotificacion({
    type: "producto_creado",
    title: "Nuevo producto",
    message: `Se ha creado el producto ${data.name} (SKU: ${data.sku})`,
    data: { productId: data.id, sku: data.sku, nombre: data.name },
    userId: null,
  });
  return sendSuccess(res, data, "Producto creado", 201);
});

const actualizar = asyncHandler(async (req, res) => {
  const data = await productosService.actualizarProducto(
    Number(req.params.id),
    req.body,
  );
  return sendSuccess(res, data, "Producto actualizado");
});

const eliminar = asyncHandler(async (req, res) => {
  const data = await productosService.eliminarProducto(Number(req.params.id));
  return sendSuccess(res, data, "Producto eliminado");
});

module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar,
};
