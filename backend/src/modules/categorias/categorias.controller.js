const categoriasService = require("./categorias.service");
const { asyncHandler } = require("../../shared/utils/async-handler");
const { sendSuccess } = require("../../shared/utils/http-response");

const listar = asyncHandler(async (req, res) => {
  const soloActivas = req.query.isActive === "true";
  const data = await categoriasService.listarCategorias(soloActivas);
  return sendSuccess(res, data, "Listado de categorías");
});

const crear = asyncHandler(async (req, res) => {
  const data = await categoriasService.crearCategoria(req.body);
  return sendSuccess(res, data, "Categoría creada", 201);
});

const actualizar = asyncHandler(async (req, res) => {
  const data = await categoriasService.actualizarCategoria(
    Number(req.params.id),
    req.body,
  );
  return sendSuccess(res, data, "Categoría actualizada");
});

const eliminar = asyncHandler(async (req, res) => {
  const data = await categoriasService.eliminarCategoria(Number(req.params.id));
  return sendSuccess(res, data, "Categoría eliminada (desactivada)");
});

module.exports = { listar, crear, actualizar, eliminar };
