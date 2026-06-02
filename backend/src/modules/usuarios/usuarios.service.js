const usuariosRepository = require("./usuarios.repository");
const { AppError } = require("../../shared/errors/AppError");
const {
  createUsuarioSchema,
  updateStatusSchema,
  updateUsuarioSchema,
} = require("./usuarios.schema");
const { hashPassword } = require("../../shared/helpers/hash.helper");
const { ZodError } = require("zod");

async function listarUsuarios() {
  return usuariosRepository.findAll();
}

async function crearUsuario(payload) {
  try {
    const parsed = createUsuarioSchema.parse(payload);

    const existing = await usuariosRepository.findByUsernameOrEmail(
      parsed.username,
      parsed.email,
    );
    if (existing) {
      throw new AppError("Ya existe un usuario con ese username o email", 409);
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
      throw new AppError("Payload de usuario inválido", 400, error.flatten());
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
      throw new AppError("Payload de estado inválido", 400, error.flatten());
    }
    throw error;
  }
}

// ✅ NUEVO: Actualizar usuario
async function actualizarUsuario(id, payload) {
  try {
    const parsed = updateUsuarioSchema.parse(payload);

    // Verificar que el usuario existe
    const existingUser = await usuariosRepository.findById(id);
    if (!existingUser) {
      throw new AppError("Usuario no encontrado", 404);
    }

    // Verificar unicidad de username/email (excluyendo el mismo ID)
    const conflict = await usuariosRepository.findByUsernameOrEmail(
      parsed.username,
      parsed.email,
      id,
    );
    if (conflict) {
      throw new AppError(
        "Ya existe otro usuario con ese username o email",
        409,
      );
    }

    const updateData = {
      username: parsed.username,
      email: parsed.email.toLowerCase(),
      fullName: parsed.fullName,
      role: parsed.role,
    };

    // Si se proporciona nueva contraseña, la hasheamos
    if (parsed.password) {
      updateData.passwordHash = await hashPassword(parsed.password);
    }

    return usuariosRepository.updateUser(id, updateData);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "Payload de actualización inválido",
        400,
        error.flatten(),
      );
    }
    throw error;
  }
}

module.exports = {
  listarUsuarios,
  crearUsuario,
  cambiarEstado,
  actualizarUsuario,
};
