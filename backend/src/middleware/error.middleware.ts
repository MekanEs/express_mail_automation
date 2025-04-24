import { Request, Response, NextFunction } from 'express';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Определяем statusCode. Если ошибка уже имеет статус (например, из другого middleware или сервиса), используем его.
  // Иначе, если статус ответа был 200 OK, значит, ошибка произошла внутри нашего кода, и мы возвращаем 500 Internal Server Error.
  // Если статус ответа не 200, значит, он был установлен ранее (например, 404 Not Found), и мы его сохраняем.
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

  res.status(statusCode);

  res.json({
    message: err.message,
    // Включаем stack trace только в режиме разработки для отладки
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack, // Заменил null на '🥞' для наглядности в продакшене
  });
};

export default errorHandler; 