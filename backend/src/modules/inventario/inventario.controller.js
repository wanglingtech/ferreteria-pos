const inventarioService = require('./inventario.service');
const { asyncHandler } = require('../../shared/utils/async-handler');
const { sendSuccess } = require('../../shared/utils/http-response');

const resumen = asyncHandler(async (req, res) => {
  const data = await inventarioService.obtenerResumen();
  return sendSuccess(res, data, 'Resumen de inventario');
});

module.exports = {
  resumen,
};
