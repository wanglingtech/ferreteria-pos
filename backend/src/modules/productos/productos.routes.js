const express = require('express');

const productosController = require('./productos.controller');
const { authenticate, authorizeRoles } = require('../../shared/middlewares/auth.middleware');

const router = express.Router();

router.get('/', authenticate, productosController.listar);
router.get('/:id', authenticate, productosController.obtener);
router.post('/', authenticate, authorizeRoles('ADMIN'), productosController.crear);
router.patch('/:id', authenticate, authorizeRoles('ADMIN'), productosController.actualizar);
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), productosController.eliminar);

module.exports = router;
