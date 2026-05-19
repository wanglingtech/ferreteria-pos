const { z } = require('zod');

const createProductoSchema = z.object({
  sku: z.string().min(2),
  nombre: z.string().min(2),
  descripcion: z.string().optional(),
  precio: z.number().positive(),
  stock: z.number().int().nonnegative(),
  stockMinimo: z.number().int().nonnegative(),
  categoriaId: z.number().int().positive().nullable().optional(),
  imagenUrl: z.string().url().optional(),
});

const updateProductoSchema = createProductoSchema.partial();

module.exports = {
  createProductoSchema,
  updateProductoSchema,
};
