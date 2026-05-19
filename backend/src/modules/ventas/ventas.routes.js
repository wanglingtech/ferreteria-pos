const express = require('express');

const ventasController = require('./ventas.controller');
const { authenticate, authorizeRoles } = require('../../shared/middlewares/auth.middleware');

const router = express.Router();

router.get('/', authenticate, ventasController.listar);
router.post('/', authenticate, authorizeRoles('ADMIN', 'SELLER'), ventasController.crear);

module.exports = router;
