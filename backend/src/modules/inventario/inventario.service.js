const inventarioRepository = require("./inventario.repository");

/**
 * Servicio que obtiene el resumen de inventario
 */
async function obtenerResumen() {
  return inventarioRepository.getResumenInventario();
}

/**
 * Servicio que obtiene productos críticos (stock <= mínimo)
 * @param {string} search - término de búsqueda (opcional)
 */
async function obtenerProductosCriticos(search = "") {
  return inventarioRepository.getProductosCriticos(search);
}

module.exports = {
  obtenerResumen,
  obtenerProductosCriticos,
};
