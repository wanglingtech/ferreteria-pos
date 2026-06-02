const { ZodError } = require("zod");
const categoriasRepository = require("./categorias.repository");
const {
  createCategoriaSchema,
  updateCategoriaSchema,
} = require("./categorias.schema");
const { AppError } = require("../../shared/errors/AppError");

async function listarCategorias(soloActivas = false) {
  return categoriasRepository.findAll(soloActivas);
}

async function crearCategoria(payload) {
  try {
    const parsed = createCategoriaSchema.parse(payload);
    const existing = await categoriasRepository.findByName(parsed.nombre);
    if (existing)
      throw new AppError("Ya existe una categoría con ese nombre", 409);
    return categoriasRepository.create(parsed.nombre);
  } catch (error) {
    if (error instanceof ZodError)
      throw new AppError("Datos inválidos", 400, error.flatten());
    throw error;
  }
}

async function actualizarCategoria(id, payload) {
  try {
    const parsed = updateCategoriaSchema.parse(payload);
    if (Object.keys(parsed).length === 0)
      throw new AppError("Debe enviar al menos un campo", 400);
    if (parsed.nombre) {
      const existing = await categoriasRepository.findByName(parsed.nombre);
      if (existing && existing.id !== id)
        throw new AppError("Ya existe otra categoría con ese nombre", 409);
    }
    return categoriasRepository.update(id, parsed);
  } catch (error) {
    if (error instanceof ZodError)
      throw new AppError("Datos inválidos", 400, error.flatten());
    throw error;
  }
}

async function eliminarCategoria(id) {
  return categoriasRepository.remove(id);
}

module.exports = {
  listarCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
};
