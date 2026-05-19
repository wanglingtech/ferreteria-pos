const inventarioRepository = require('./inventario.repository');

async function obtenerResumen() {
  return inventarioRepository.getResumenInventario();
}

module.exports = {
  obtenerResumen,
};
