const { z } = require("zod");

// ============================================================
// EXPRESIONES REGULARES ESTRICTAS
// ============================================================
// Username: letras, números, guion bajo, punto, guion. Sin espacios.
const usernameRegex = /^[a-zA-Z0-9_.-]+$/;

// Nombre completo: comienza con letra, luego puede contener espacios, guiones, apóstrofes o puntos
// pero siempre debe haber al menos una letra entre ellos. Rechaza "....." o caracteres repetidos sin letras.
const fullNameRegex =
  /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]+(?:[\s\-'\.][a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]+)*$/;

// ============================================================
// ESQUEMAS
// ============================================================
const createUsuarioSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Mínimo 3 caracteres" })
    .max(30, { message: "Máximo 30 caracteres" })
    .regex(usernameRegex, {
      message:
        "Solo letras, números, guion bajo (_), punto (.) o guión (-). Sin espacios.",
    }),
  email: z
    .string()
    .email({ message: "Correo electrónico inválido" })
    .max(100, { message: "Máximo 100 caracteres" }),
  fullName: z
    .string()
    .min(2, { message: "Mínimo 2 caracteres" })
    .max(100, { message: "Máximo 100 caracteres" })
    .regex(fullNameRegex, {
      message:
        "Nombre inválido. Use letras, espacios, guiones, apóstrofes o puntos (ej: Juan Pérez, Mª José, D'Angelo).",
    }),
  password: z.string().min(6, { message: "Mínimo 6 caracteres" }),
  role: z.enum(["ADMIN", "SELLER"], { message: "Rol debe ser ADMIN o SELLER" }),
});

const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

const updateUsuarioSchema = z.object({
  username: z.string().min(3).max(30).regex(usernameRegex).optional(),
  email: z.string().email().max(100).optional(),
  fullName: z.string().min(2).max(100).regex(fullNameRegex).optional(),
  role: z.enum(["ADMIN", "SELLER"]).optional(),
  password: z.string().min(6).optional(),
  imageUrl: z.string().url().optional(),
});

module.exports = {
  createUsuarioSchema,
  updateStatusSchema,
  updateUsuarioSchema,
};
