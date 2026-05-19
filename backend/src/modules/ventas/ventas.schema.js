const { z } = require('zod');

const ventaItemSchema = z.object({
  productoId: z.number().int().positive(),
  cantidad: z.number().int().positive(),
});

const createVentaSchema = z.object({
  clienteNombre: z.string().optional(),
  items: z.array(ventaItemSchema).min(1),
});

module.exports = {
  createVentaSchema,
};
