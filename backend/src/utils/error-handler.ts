import { Request, Response, NextFunction } from 'express';

// Пользовательский класс ошибки API
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
    // Важно для корректной работы instanceof с ошибками TypeScript
    Object.setPrototypeOf(this, ApiError.prototype); 
  }
}

// Middleware для обработки ошибок
export const errorMiddleware = (
    err: Error, 
    _req: Request, // Используем _req, если не используем request
    res: Response, 
    _next: NextFunction // Используем _next, если не вызываем next()
) => {
  // Логируем ошибку для отладки
  console.error('Произошла ошибка:', err.stack || err);

  // Если это наша кастомная ошибка API
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message });
  }

  // Для всех остальных ошибок возвращаем 500
  return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
};

// Функции для создания конкретных ошибок API
export const badRequest = (message: string): ApiError => {
  return new ApiError(400, message);
};

export const unauthorized = (message: string = 'Пользователь не авторизован'): ApiError => {
  return new ApiError(401, message);
};

export const forbidden = (message: string = 'Доступ запрещен'): ApiError => {
  return new ApiError(403, message);
};

export const notFound = (message: string = 'Ресурс не найден'): ApiError => {
  return new ApiError(404, message);
};

export const internal = (message: string = 'Внутренняя ошибка сервера'): ApiError => {
  return new ApiError(500, message);
}; 