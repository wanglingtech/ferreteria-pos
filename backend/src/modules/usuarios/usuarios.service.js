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
      ...(parsed.imageUrl ? { imageUrl: parsed.imageUrl } : {}), // ✅ nuevo: actualizar imageUrl si se proporciona
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

// ✅ NUEVO: Actualizar propio perfil (campos limitados: fullName, email, imageUrl)
async function actualizarUsuarioProfile(id, payload) {
  try {
    // Schema más restrictivo: solo campos que un usuario puede cambiar de su propio perfil
    const updateProfileSchema = require("zod").z.object({
      fullName: require("zod").z.string().min(2).optional(),
      email: require("zod").z.string().email().optional(),
      imageUrl: require("zod").z.string().url().optional(),
    });

    const parsed = updateProfileSchema.parse(payload);

    // Verificar que el usuario existe
    const existingUser = await usuariosRepository.findById(id);
    if (!existingUser) {
      throw new AppError("Usuario no encontrado", 404);
    }

    // Si cambia email, verificar unicidad
    if (parsed.email) {
      const conflict = await usuariosRepository.findByUsernameOrEmail(
        existingUser.username, // no cambia username
        parsed.email,
        id,
      );
      if (conflict) {
        throw new AppError("Ya existe otro usuario con ese email", 409);
      }
    }

    const updateData = {
      ...(parsed.fullName && { fullName: parsed.fullName }),
      ...(parsed.email && { email: parsed.email.toLowerCase() }),
      ...(parsed.imageUrl && { imageUrl: parsed.imageUrl }),
    };

    return usuariosRepository.updateUser(id, updateData);
  } catch (error) {
    if (error instanceof ZodError) {
      const { z } = require("zod");
      throw new AppError(
        "Perfil inválido: solo puedes cambiar nombre, email e imagen",
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
  actualizarUsuarioProfile,
};
