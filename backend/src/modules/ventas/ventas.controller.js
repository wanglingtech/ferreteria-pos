const ventasService = require('./ventas.service');
const { asyncHandler } = require('../../shared/utils/async-handler');
const { sendSuccess } = require('../../shared/utils/http-response');

const listar = asyncHandler(async (req, res) => {
  const data = await ventasService.listarVentas();
  return sendSuccess(res, data, 'Listado de ventas');
});

const crear = asyncHandler(async (req, res) => {
  const data = await ventasService.crearVenta(req.body, req.user);
  return sendSuccess(res, data, 'Venta registrada', 201);
});

module.exports = {
  listar,
  crear,
};
