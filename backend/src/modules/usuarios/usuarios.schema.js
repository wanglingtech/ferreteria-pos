const { z } = require("zod");

const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
const fullNameRegex =
  /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]+(?:[\s\-'\.][a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]+)*$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

const createUsuarioSchema = z.object({
  username: z.string().min(3).max(30).regex(usernameRegex, {
    message:
      "Solo letras, números, guion bajo (_), punto (.) o guión (-). Sin espacios.",
  }),
  email: z.string().email({ message: "Correo electrónico inválido" }).max(100),
  fullName: z.string().min(2).max(100).regex(fullNameRegex, {
    message:
      "Nombre inválido. Use letras, espacios, guiones, apóstrofes o puntos (ej: Juan Pérez, Mª José, D'Angelo).",
  }),
  password: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
    .regex(passwordRegex, {
      message:
        "La contraseña debe contener al menos una mayúscula, una minúscula y un número. Solo caracteres ASCII comunes.",
    }),
  role: z.enum(["ADMIN", "SELLER"]),
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
