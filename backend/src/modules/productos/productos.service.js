const { ZodError } = require('zod');

const productosRepository = require('./productos.repository');
const { AppError } = require('../../shared/errors/AppError');
const { createProductoSchema, updateProductoSchema } = require('./productos.schema');

async function listarProductos(filters) {
  return productosRepository.findAll(filters);
}

async function obtenerProducto(id) {
  const producto = await productosRepository.findById(id);
  if (!producto) {
    throw new AppError('Producto no encontrado', 404);
  }
  return producto;
}

async function crearProducto(payload) {
  try {
    const data = createProductoSchema.parse(payload);
    return productosRepository.create(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError('Payload de producto inválido', 400, error.flatten());
    }
    throw error;
  }
}

async function actualizarProducto(id, payload) {
  try {
    const data = updateProductoSchema.parse(payload);
    if (Object.keys(data).length === 0) {
      throw new AppError('Debe enviar al menos un campo para actualizar', 400);
    }
    return productosRepository.update(id, data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError('Payload de producto inválido', 400, error.flatten());
    }
    throw error;
  }
}

async function eliminarProducto(id) {
  return productosRepository.remove(id);
}

module.exports = {
  listarProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
};
