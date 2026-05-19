const { ZodError } = require('zod');

const { env } = require('../../config/env');
const { signAccessToken } = require('../../config/jwt');
const { comparePassword } = require('../../shared/helpers/hash.helper');
const { AppError } = require('../../shared/errors/AppError');
const authRepository = require('./auth.repository');
const { loginSchema } = require('./auth.schema');

async function login(payload) {
  let parsedData;

  try {
    parsedData = loginSchema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError('Invalid login payload', 400, error.flatten());
    }
    throw error;
  }

  const user = await authRepository.findByIdentifier(parsedData.identifier);

  if (!user || !user.isActive) {
    throw new AppError('Invalid credentials', 401);
  }

  const passwordIsValid = await comparePassword(parsedData.password, user.passwordHash);

  if (!passwordIsValid) {
    throw new AppError('Invalid credentials', 401);
  }

  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    username: user.username,
    email: user.email,
  });

  return {
    tokenType: 'Bearer',
    accessToken,
    expiresIn: env.JWT_EXPIRES_IN,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  };
}

async function me(userId) {
  const profile = await authRepository.findProfileById(userId);

  if (!profile || !profile.isActive) {
    throw new AppError('User not found or inactive', 404);
  }

  return profile;
}

module.exports = {
  login,
  me,
};
