import { logger } from '../config/logger.js';

export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

const PRISMA_ERROR_MESSAGES = {
  P2003: 'El registro relacionado no existe',
  P2002: 'Ya existe un registro con ese valor único',
  P2025: 'Registro no encontrado para actualizar o eliminar',
};

export function errorHandler(err, req, res, next) {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  if (err.code && PRISMA_ERROR_MESSAGES[err.code]) {
    return res.status(400).json({
      error: PRISMA_ERROR_MESSAGES[err.code],
    });
  }

  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({
      error: 'Datos inválidos enviados al servidor',
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
