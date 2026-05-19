const { ZodError } = require('zod');

const { AppError } = require('../../shared/errors/AppError');
const ventasRepository = require('./ventas.repository');
const { createVentaSchema } = require('./ventas.schema');

async function listarVentas() {
  return ventasRepository.findAll();
}

async function crearVenta(payload, authUser) {
  try {
    const parsed = createVentaSchema.parse(payload);
    return ventasRepository.create({
      ...parsed,
      vendedorId: authUser.sub,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError('Payload de venta inválido', 400, error.flatten());
    }
    throw error;
  }
}

module.exports = {
  listarVentas,
  crearVenta,
};
