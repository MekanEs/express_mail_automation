import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import mainRouter from './routes';
import cors from 'cors';
import { errorMiddleware } from './utils/error-handler';

const app = express();

const staticPath = path.resolve(__dirname, '../public');
app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true // если используешь куки
  })
);
app.use(express.static(staticPath));
app.use(express.json());

// Все основные API маршруты
app.use(mainRouter);

// Обработка запросов к статике (если не найдено API)
app.get('*', (_, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Middleware для обработки 404 (если ни один маршрут не подошел)
app.use((req: Request, res: Response, next: NextFunction) => {
    // Создаем ошибку 404 и передаем ее дальше
    const error = new Error('Not Found');
    (error as any).status = 404;
    next(error);
});

// Глобальный обработчик ошибок (принимает 4 аргумента)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    // Используем импортированный errorMiddleware
    errorMiddleware(err, req, res, next);
});

export default app;
