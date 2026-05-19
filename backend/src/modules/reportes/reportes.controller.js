const reportesService = require('./reportes.service');
const { asyncHandler } = require('../../shared/utils/async-handler');
const { sendSuccess } = require('../../shared/utils/http-response');

const resumen = asyncHandler(async (req, res) => {
  const data = await reportesService.obtenerReporte();
  return sendSuccess(res, data, 'Reporte general');
});

module.exports = {
  resumen,
};
