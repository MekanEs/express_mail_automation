
// backend/src/worker.ts
import "reflect-metadata";
import { Logger, run } from 'graphile-worker';
import { env } from './configs/supabase_env';
import { logger } from './utils/logger';
import { GraphileWorkerLoggerAdapter } from './utils/graphileWorkerLoggerAdapter';
import processEmailTask from './worker_tasks/processEmail';
import { EventEmitter } from 'events';

// Определяем интерфейсы для событий graphile-worker


const startWorker = async () => {
  if (!env.DATABASE_URL) {
    logger.error('DATABASE_URL не определен в переменных окружения для воркера!', true);
    throw new Error('DATABASE_URL not configured for worker.');
  }

  logger.info('[Worker] Запуск Graphile-Worker...', true);
  const taskList = {
    processEmail: processEmailTask,
  };
  const loggerAdapterInstance = new GraphileWorkerLoggerAdapter(logger);

  // Создаем объект eventEmitter для перехвата и фильтрации событий
  const workerEvents = new EventEmitter();



  // Запускаем раннер в режиме воркера
  const runner = await run({
    connectionString: env.DATABASE_URL,
    // Указываем директорию, где лежат наши обработчики задач
    // Concurrency: сколько задач этот воркер может обрабатывать параллельно
    // Начните с небольшого числа, например, 1 или 2, особенно если задачи ресурсоемкие
    concurrency: 2,
    logger: loggerAdapterInstance as unknown as Logger,
    events: workerEvents, // Передаем наш eventEmitter для перехвата событий

    // pollInterval: 1000, // Интервал опроса БД в мс (Graphile-worker также использует LISTEN/NOTIFY)
  }, taskList,);

  logger.info('[Worker] Graphile-Worker запущен и слушает задачи.', true);

  // Грамотное завершение воркера
  await runner.promise; // Ожидаем завершения раннера (например, по сигналу)
  logger.info('[Worker] Graphile-Worker остановлен.', true);
};

startWorker().catch(error => {
  logger.error('[Worker] Критическая ошибка при запуске или работе воркера:', error, true);
  process.exit(1);
});

// Обработка сигналов завершения для graceful shutdown
// Graphile-worker сам обрабатывает SIGINT/SIGTERM по умолчанию,
// но явное добавление может быть полезно для отладки или кастомной логики.
process.on('SIGTERM', () => {
  logger.info('[Worker] Получен сигнал SIGTERM. Graphile-Worker завершает работу...', true);
  // Graphile-worker runner.promise разрешится при получении сигнала
});

process.on('SIGINT', () => {
  logger.info('[Worker] Получен сигнал SIGINT. Graphile-Worker завершает работу...', true);
  // Graphile-worker runner.promise разрешится при получении сигнала
});
