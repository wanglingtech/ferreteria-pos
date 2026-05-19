const usuariosService = require('./usuarios.service');
const { asyncHandler } = require('../../shared/utils/async-handler');
const { sendSuccess } = require('../../shared/utils/http-response');

const listar = asyncHandler(async (req, res) => {
  const data = await usuariosService.listarUsuarios();
  return sendSuccess(res, data, 'Listado de usuarios');
});

module.exports = {
  listar,
};
