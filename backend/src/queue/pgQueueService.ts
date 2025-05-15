// backend/src/queue/pgQueueService.ts
import { run, Runner } from 'graphile-worker';
import { env } from '../configs/supabase_env';
import { logger } from '../utils/logger';
import { ProcessJobData } from '../types/queueTypes';

let runner: Runner | null = null;

export const initializeQueue = async () => {
  if (!env.DATABASE_URL) {
    logger.error('DATABASE_URL не определен в переменных окружения!');
    throw new Error('DATABASE_URL not configured.');
  }
  try {
    runner = await run({
      connectionString: env.DATABASE_URL,
      noHandleSignals: true,
      pollInterval: 10000, // Можно оставить или увеличить
      // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
      // Явно указываем, что этот раннер не должен загружать задачи
      // Один из этих вариантов должен сработать:
      taskDirectory: undefined, // Вариант 1: явно указать undefined
      // tasks: {},             // Вариант 2: передать пустой объект задач
      // workerPoolSize: 0,     // Вариант 3 (дополнительно): указать, что нет воркеров в этом процессе
      // concurrency: 0,        // Вариант 4 (дополнительно): указать, что нет воркеров
      // -------------------------
    });
    logger.info('[PG Queue Service] Graphile-Worker раннер инициализирован для добавления задач.');
  } catch (error) {
    logger.error('[PG Queue Service] Ошибка инициализации Graphile-Worker раннера:', error);
    throw error;
  }
};

export const addProcessJob = async (payload: ProcessJobData): Promise<string> => {
  if (!runner) {
    logger.error('[PG Queue Service] Graphile-Worker раннер не инициализирован. Невозможно добавить задачу.');
    throw new Error('Queue service not initialized.');
  }
  try {
    const job = await runner.addJob('processEmail', payload);
    // graphile-worker возвращает job.id как BigInt, преобразуем в строку, если нужно
    const jobIdString = String(job.id);
    logger.info(`[PG Queue Service] Задача 'processEmail' добавлена в очередь. Graphile-Worker ID: ${jobIdString}`);
    return jobIdString;
  } catch (error) {
    logger.error('[PG Queue Service] Ошибка при добавлении задачи в очередь:', error);
    throw error;
  }
};

export const releaseQueue = async () => {
  if (runner) {
    logger.info('[PG Queue Service] Закрытие Graphile-Worker раннера...');
    await runner.stop();
    logger.info('[PG Queue Service] Graphile-Worker раннер закрыт.');
  }
}
