const { z } = require("zod");

const createProductoSchema = z.object({
  sku: z.string().min(2),
  nombre: z.string().min(2),
  descripcion: z.string().optional(),
  precio: z.coerce.number().positive(),
  stock: z.coerce.number().int().nonnegative(),
  stockMinimo: z.coerce.number().int().nonnegative(),
  categoriaId: z
    .union([z.coerce.number().int().positive(), z.null()])
    .optional(),
  imagenUrl: z.string().url().optional(),
});

// ✅ Agregar isActive opcional
const updateProductoSchema = createProductoSchema.partial().extend({
  isActive: z.boolean().optional(),
});

module.exports = {
  createProductoSchema,
  updateProductoSchema,
};
