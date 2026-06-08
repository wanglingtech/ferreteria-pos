const { z } = require("zod");

const createUsuarioSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "SELLER"]),
});

const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

// ✅ NUEVO: Schema para actualizar usuario (todos los campos excepto password opcional)
const updateUsuarioSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  fullName: z.string().min(2),
  role: z.enum(["ADMIN", "SELLER"]),
  password: z.string().min(6).optional(), // opcional, si se envía se actualiza
  imageUrl: z.string().url().optional(), // ✅ nuevo: URL de imagen de perfil
});

module.exports = {
  createUsuarioSchema,
  updateStatusSchema,
  updateUsuarioSchema,
};
