const { z } = require('zod');

const loginSchema = z.object({
  identifier: z.string().min(3, 'identifier must contain at least 3 characters'),
  password: z.string().min(6, 'password must contain at least 6 characters'),
});

module.exports = {
  loginSchema,
};
