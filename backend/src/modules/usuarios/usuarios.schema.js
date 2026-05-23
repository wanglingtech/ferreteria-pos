const { z } = require('zod');

const createUsuarioSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'SELLER']),
});

const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

module.exports = {
  createUsuarioSchema,
  updateStatusSchema,
};
