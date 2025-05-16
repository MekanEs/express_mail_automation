// backend/src/worker_tasks/processEmail.ts
import { Task, JobHelpers } from 'graphile-worker';
import { ProcessJobData } from '../types/queueTypes';
import { logger as appLogger } from '../utils/logger'; // Переименовал для ясности, если helpers.logger будет основным
import { handleError } from '../utils/error-handler';

// Импортируем все сервисы, которые нужны для выполнения логики
import { processOrchestrationService } from '../services/process/processOrchestration.service';

const processEmailTask: Task = async (
  payload: unknown,
  helpers: JobHelpers
) => {
  const jobData = payload as ProcessJobData;
  if (
    !jobData ||
    typeof jobData.process_id !== 'string' ||
    !Array.isArray(jobData.accounts) ||
    !Array.isArray(jobData.emails) ||
    typeof jobData.config !== 'object' ||
    jobData.config === null
  ) {
    appLogger.error(
      `[Worker Task: processEmail] Некорректный payload для задачи ID: ${helpers.job.id}. Payload:`,
      payload
    );
    throw new Error('Invalid job payload structure');
  }

  const { process_id } = jobData;
  helpers.logger.info(
    `[Worker Task: processEmail] Начат процесс обработки почты для ID: ${process_id}. Задача Graphile-Worker ID: ${helpers.job.id}`
  );

  try {
    // Передаём jobData как параметры для processOrchestrationService
    await processOrchestrationService.startEmailProcessing(jobData);
    helpers.logger.info(
      `[Worker Task: processEmail] Процесс обработки для ID: ${process_id} завершен.`
    );
  } catch (orchestrationErr) {
    const criticalErrorMessage = `[Worker Task ID: ${helpers.job.id}] Критическая ошибка в оркестрации процесса для ID: ${process_id}:`;
    handleError(
      orchestrationErr,
      criticalErrorMessage,
      'processEmailTask.mainTryCatch'
    );
    throw orchestrationErr;
  }
};

export default processEmailTask;
