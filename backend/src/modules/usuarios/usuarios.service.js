const usuariosRepository = require('./usuarios.repository');
const { AppError } = require('../../shared/errors/AppError');
const { createUsuarioSchema, updateStatusSchema } = require('./usuarios.schema');
const { hashPassword } = require('../../shared/helpers/hash.helper');
const { ZodError } = require('zod');

async function listarUsuarios() {
  return usuariosRepository.findAll();
}

async function crearUsuario(payload) {
  try {
    const parsed = createUsuarioSchema.parse(payload);

    const existing = await usuariosRepository.findByUsernameOrEmail(parsed.username, parsed.email);
    if (existing) {
      throw new AppError('Ya existe un usuario con ese username o email', 409);
    }

    const passwordHash = await hashPassword(parsed.password);

    return usuariosRepository.create({
      username: parsed.username,
      email: parsed.email.toLowerCase(),
      fullName: parsed.fullName,
      passwordHash,
      role: parsed.role,
      isActive: true,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError('Payload de usuario inválido', 400, error.flatten());
    }
    throw error;
  }
}

async function cambiarEstado(id, payload) {
  try {
    const parsed = updateStatusSchema.parse(payload);
    return usuariosRepository.updateStatus(id, parsed.isActive);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError('Payload de estado inválido', 400, error.flatten());
    }
    throw error;
  }
}

module.exports = {
  listarUsuarios,
  crearUsuario,
  cambiarEstado,
};
