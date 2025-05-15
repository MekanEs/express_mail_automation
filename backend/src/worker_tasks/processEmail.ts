// backend/src/worker_tasks/processEmail.ts
import { Task, JobHelpers } from 'graphile-worker';
import { ProcessJobData } from '../types/queueTypes';
import { logger as appLogger } from '../utils/logger'; // Переименовал для ясности, если helpers.logger будет основным
import { handleError } from '../utils/error-handler';

// Импортируем все сервисы, которые нужны для выполнения логики
import { accountProcessingService } from '../services/process/accountProcessing.service';
// ИСПРАВЛЕНИЕ 1: Убираем фигурные скобки для default export
import { reportService } from '../services/process/utils/report.service';
import { fileSystemService } from '../services/process/utils/fileSystem.service';
import { manageDirectories } from '../services/process/utils/manageDirectories';
import { getConfig } from '../utils/getConfig';
import { browserInteractionService, BrowserTask } from '../services/process/browser/browserInteraction.service';

const processEmailTask: Task = async (
  payload: unknown,
  helpers: JobHelpers
) => {
  const jobData = payload as ProcessJobData;
  if (
    !jobData ||
    typeof jobData.process_id !== 'string' ||
    !Array.isArray(jobData.accounts) ||
    !Array.isArray(jobData.emails)
  ) {
    appLogger.error(
      `[Worker Task: processEmail] Некорректный payload для задачи ID: ${helpers.job.id}. Payload:`,
      payload
    );
    throw new Error('Invalid job payload structure');
  }

  const {
    accounts,
    emails,
    limit = 100,
    openRate = 70,
    repliesCount = 0,
    process_id,
    baseOutputPath,
  } = jobData;

  helpers.logger.info(
    `[Worker Task: processEmail] Начат процесс обработки почты для ID: ${process_id}. Задача Graphile-Worker ID: ${helpers.job.id}`
  );

  const tempDirectories: string[] = [];
  let browser = null;

  try {
    browser = await browserInteractionService.launchBrowser();

    for (const account of accounts) {
      const providerConfig = getConfig(account.provider);
      const report = reportService.initializeReport(
        process_id,
        account.email,
        emails.join(' ,')
      );
      const allBrowserTasks: BrowserTask[] = [];

      for (const fromEmail of emails) {
        const tempDirPath = manageDirectories(
          __dirname,
          tempDirectories,
          process_id,
          account.email,
          baseOutputPath
        );

        const accountProcessingParams = {
          account,
          fromEmail,
          providerConfig,
          process_id,
          limit,
          repliesToAttempt: repliesCount,
          report,
          tempDirPath,
        };

        try {
          const tasksFromAccount =
            await accountProcessingService.processAccountFromSender(
              accountProcessingParams
            );
          allBrowserTasks.push(...tasksFromAccount);
        } catch (accountProcessingError) {
          // ИСПРАВЛЕНИЕ 2: Убедимся, что второй аргумент handleError - строка
          const errorMessage = `[Worker Task ID: ${helpers.job.id}] Ошибка при обработке ${account.email} от ${fromEmail}:`;
          handleError(
            accountProcessingError,
            errorMessage, // Передаем строку
            'processEmailTask.accountLoop' // Добавляем имя функции для контекста
          );
        }
      }

      if (allBrowserTasks.length > 0 && browser) {
        await browserInteractionService.processTasksWithBrowser(
          browser,
          allBrowserTasks,
          openRate,
          report,
        );
        helpers.logger.info(
          `[Worker Task ID: ${helpers.job.id}] Завершена обработка ${allBrowserTasks.length} задач в браузере для аккаунта ${account.email}.`
        );
      } else {
        helpers.logger.info(
          `[Worker Task ID: ${helpers.job.id}] Нет задач для обработки в браузере для аккаунта ${account.email}.`
        );
      }

      reportService.finalizeReportStatus(report);
      await reportService.submitReport(
        report,
        providerConfig.mailboxes.join(', ')
      );
    }

    helpers.logger.info(
      `[Worker Task: processEmail] Процесс обработки для ID: ${process_id} завершен.`
    );
  } catch (orchestrationErr) {
    // ИСПРАВЛЕНИЕ 2 (аналогично): Убедимся, что второй аргумент handleError - строка
    const criticalErrorMessage = `[Worker Task ID: ${helpers.job.id}] Критическая ошибка в оркестрации процесса для ID: ${process_id}:`;
    handleError(
      orchestrationErr,
      criticalErrorMessage, // Передаем строку
      'processEmailTask.mainTryCatch' // Добавляем имя функции для контекста
    );
    throw orchestrationErr;
  } finally {
    if (browser) {
      await browserInteractionService.closeBrowser(browser);
    }
    await fileSystemService.cleanUpTempDirectory(tempDirectories, process_id);
  }
};

export default processEmailTask;
