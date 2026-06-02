const { z } = require("zod");

const createCategoriaSchema = z.object({
  nombre: z.string().min(2).max(50),
});

const updateCategoriaSchema = createCategoriaSchema.partial().extend({
  isActive: z.boolean().optional(),
});

module.exports = { createCategoriaSchema, updateCategoriaSchema };
