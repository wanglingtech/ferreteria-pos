const { z } = require("zod");

// ✅ Expresión regular para nombres de cliente: letras, espacios, tildes, ñ, apóstrofe, guion, punto.
// Permite: Juan Pérez, María José, Ana-María, Mª José, D'Angelo, etc.
// No permite: números, símbolos como @#$%&, etc.
const nombreClienteRegex = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s\-\'\.]+$/;

const ventaItemSchema = z.object({
  productoId: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().int().positive(),
});

// ✅ Ahora clienteNombre es obligatorio y debe cumplir el patrón
const createVentaSchema = z.object({
  clienteNombre: z
    .string()
    .min(3, {
      message: "El nombre del cliente debe tener al menos 3 caracteres",
    })
    .max(80, {
      message: "El nombre del cliente no puede exceder 80 caracteres",
    })
    .regex(nombreClienteRegex, {
      message:
        "El nombre del cliente solo puede contener letras, espacios, puntos, guiones y apóstrofes. No use números ni símbolos.",
    })
    .transform((val) => val.trim()), // limpia espacios al inicio/fin
  items: z
    .array(ventaItemSchema)
    .min(1, { message: "Debe incluir al menos un producto" }),
});

module.exports = {
  createVentaSchema,
};
