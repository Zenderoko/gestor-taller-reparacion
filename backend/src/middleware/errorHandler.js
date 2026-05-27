import { logger } from '../config/logger.js';

export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export function errorHandler(err, req, res, next) {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  logger.error('Error no controlado', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  return res.status(500).json({
    error: 'Error interno del servidor',
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: `Ruta no encontrada: ${req.method} ${req.path}`,
  });
}
