const { AppError } = require('../errors/AppError');
const { Prisma } = require('@prisma/client');

function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(err, req, res, next) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaKnownError(err, res);
  }

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

function handlePrismaKnownError(error, res) {
  const map = {
    P2002: {
      statusCode: 409,
      message: 'Conflicto de datos: valor único duplicado',
    },
    P2003: {
      statusCode: 400,
      message: 'Referencia inválida en una relación',
    },
    P2025: {
      statusCode: 404,
      message: 'Registro no encontrado',
    },
  };

  const normalized = map[error.code] || {
    statusCode: 500,
    message: 'Error de base de datos',
  };

  return res.status(normalized.statusCode).json({
    ok: false,
    message: normalized.message,
    details: {
      code: error.code,
    },
  });
}

module.exports = {
  notFound,
  errorHandler,
};
