const { AppError } = require('../errors/AppError');

function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(err, req, res, next) {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const message = isAppError ? err.message : 'Internal server error';
  const details = isAppError ? err.details : null;

  if (!isAppError) {
    console.error('[UNHANDLED_ERROR]', err);
  }

  const payload = {
    ok: false,
    message,
  };

  if (details) {
    payload.details = details;
  }

  if (process.env.NODE_ENV === 'development' && !isAppError) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}

module.exports = {
  notFound,
  errorHandler,
};
