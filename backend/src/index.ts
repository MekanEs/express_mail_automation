// backend/src/index.ts (Изменения)
import "reflect-metadata";
import app from './app';
import appConfig from './configs/appConfig';
import { logger } from './utils/logger';
import { initializeQueue, releaseQueue } from './queue/pgQueueService'; // Импортируем сервис очереди

appConfig(); // Загрузка переменных окружения

const port = process.env.PORT || 3002;

// Инициализируем очередь перед запуском сервера
initializeQueue()
  .then(() => {
    const server = app.listen(port, () => logger.info(`Running on port ${port}`));

    // Добавляем graceful shutdown для API сервера
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        logger.info('HTTP server closed');
        await releaseQueue(); // Закрываем раннер очереди
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT signal received: closing HTTP server');
      server.close(async () => {
        logger.info('HTTP server closed');
        await releaseQueue(); // Закрываем раннер очереди
        process.exit(0);
      });
    });

  })
  .catch((error) => {
    logger.error('Ошибка инициализации приложения:', error);
    process.exit(1); // Завершаем процесс, если очередь не инициализировалась
  });
