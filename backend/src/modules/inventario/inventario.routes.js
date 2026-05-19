const express = require('express');

const inventarioController = require('./inventario.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');

const router = express.Router();

router.get('/resumen', authenticate, inventarioController.resumen);

module.exports = router;
