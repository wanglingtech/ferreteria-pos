const { verifyAccessToken } = require('../../config/jwt');
const { AppError } = require('../errors/AppError');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('Authentication token is required', 401));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (error) {
    return next(new AppError('Invalid or expired authentication token', 401));
  }
}

function authorizeRoles(...allowedRoles) {
  return function roleGuard(req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    return next();
  };
}

module.exports = {
  authenticate,
  authorizeRoles,
};
