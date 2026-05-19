const usuariosRepository = require('./usuarios.repository');

async function listarUsuarios() {
  return usuariosRepository.findAll();
}

module.exports = {
  listarUsuarios,
};
