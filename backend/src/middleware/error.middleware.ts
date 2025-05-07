// backend/src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger'; // Assuming logger setup

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean; // Optional: Flag for expected errors vs bugs
}

export const errorMiddleware = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars
): void => {
  err.statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log the error (always log internal server errors)
  if (err.statusCode >= 500 || isDevelopment) {
    logger.error('Необработанная ошибка:', {
      message: err.message,
      statusCode: err.statusCode,
      stack: isDevelopment ? err.stack : undefined, // Only show stack in dev
      isOperational: err.isOperational ?? false
    });
  } else {
    // Log less critical client errors if needed
    logger.warn('Ошибка клиента:', {
      message: err.message,
      statusCode: err.statusCode
    });
  }


  // Send response to client
  // Avoid sending sensitive details in production
  const responseError: { status: string; message: string; stack?: string } = {
    status: err.statusCode >= 500 ? 'error' : 'fail',
    message: err.statusCode >= 500 && !isDevelopment && !err.isOperational
      ? 'Internal Server Error' // Generic message for unexpected errors in prod
      : err.message
  };

  if (isDevelopment) {
    responseError.stack = err.stack; // Include stack trace in development
  }


  res.status(err.statusCode).json(responseError);
};


