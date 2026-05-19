const express = require('express');

const usuariosController = require('./usuarios.controller');
const { authenticate, authorizeRoles } = require('../../shared/middlewares/auth.middleware');

const router = express.Router();

router.get('/', authenticate, authorizeRoles('ADMIN'), usuariosController.listar);

module.exports = router;
