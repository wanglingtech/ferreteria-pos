const ventasService = require('./ventas.service');
const { asyncHandler } = require('../../shared/utils/async-handler');
const { sendSuccess } = require('../../shared/utils/http-response');

const listar = asyncHandler(async (req, res) => {
  const data = await ventasService.listarVentas();
  return sendSuccess(res, data, 'Listado de ventas');
});

const obtener = asyncHandler(async (req, res) => {
  const data = await ventasService.obtenerVenta(Number(req.params.id));
  return sendSuccess(res, data, 'Detalle de venta');
});

const crear = asyncHandler(async (req, res) => {
  const data = await ventasService.crearVenta(req.body, req.user);
  return sendSuccess(res, data, 'Venta registrada', 201);
});

module.exports = {
  listar,
  obtener,
  crear,
};
