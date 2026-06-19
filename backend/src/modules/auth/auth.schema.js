const { z } = require("zod");

// Reutilizar regex de username (letras, números, guión bajo, punto, guión)
const usernameRegex = /^[a-zA-Z0-9_.-]+$/;

/**
 * Valida que el identifier sea un email válido O un username válido.
 * Rechaza caracteres extraños y espacios.
 */
const identifierSchema = z.string().superRefine((val, ctx) => {
  // 1. Intentar validar como email
  const emailResult = z.string().email().safeParse(val);
  if (emailResult.success) {
    return; // es un email válido
  }
  // 2. Si no es email, validar como username
  if (!usernameRegex.test(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "El identificador debe ser un email válido o un nombre de usuario (solo letras, números, guiones, puntos, guion bajo). Sin espacios.",
    });
  }
});

const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

module.exports = { loginSchema };
