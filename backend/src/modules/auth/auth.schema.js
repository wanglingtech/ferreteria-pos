const { z } = require("zod");

// Username: solo letras, números, guión bajo, punto, guión. Sin espacios.
const usernameRegex = /^[a-zA-Z0-9_.-]+$/;

// Contraseña: mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número.
// Sin espacios y sin caracteres extraños (solo ASCII común).
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(50, "Máximo 50 caracteres")
    .superRefine((val, ctx) => {
      const trimmed = val.trim();
      if (!trimmed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El identificador es obligatorio.",
        });
        return;
      }
      // Intentar validar como email
      const emailResult = z.string().email().safeParse(trimmed);
      if (emailResult.success) return;
      // Sino, validar como username
      if (!usernameRegex.test(trimmed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "El identificador debe ser un email válido o un nombre de usuario (solo letras, números, guiones, puntos, guion bajo). Sin espacios.",
        });
      }
    }),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .regex(
      passwordRegex,
      "La contraseña debe contener al menos una mayúscula, una minúscula y un número. Solo caracteres ASCII comunes.",
    ),
});

module.exports = { loginSchema };
