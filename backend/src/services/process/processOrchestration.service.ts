// src/services/process/processOrchestration.service.ts
import { ProcessRequestBody, } from '../../types/types';
import { getConfig } from '../../utils/getConfig'; // Глобальная конфигурация провайдеров
import { logger } from '../../utils/logger';
import { handleError } from '../../utils/error-handler';
import { accountProcessingService, AccountProcessingParams } from './accountProcessing.service'; // Наш новый сервис
import { Browser } from 'puppeteer'; // Импортируем тип Browser
import { browserInteractionService, BrowserTask } from './browser/browserInteraction.service'; // Импортируем сервис и тип
import { reportService } from './utils/report.service';
import { fileSystemService } from './utils/fileSystem.service';
import path from 'path';
import fs from 'fs';

interface StartProcessingParams extends ProcessRequestBody {
  process_id: string;
  // Можно добавить сюда другие глобальные параметры, если они появятся,
  // например, путь к базовой директории для файлов или настройки headless режима.
  baseOutputPath: string;
  headlessBrowser: boolean | "shell" | undefined;
}

export class ProcessOrchestrationService {
  /**
   * Запускает процесс обработки почтовых ящиков для указанных аккаунтов и email-адресов.
   * Эта функция предназначена для выполнения в фоновом режиме (например, после ответа контроллера).
   */
  public async startEmailProcessing(params: StartProcessingParams): Promise<void> {
    const {
      accounts,
      emails,
      limit = 100, // Значения по умолчанию, если не переданы
      openRate = 70,
      repliesCount = 0,
      process_id,
      baseOutputPath,
      headlessBrowser
    } = params;

    logger.info(`[Orchestration ID: ${process_id}] Запущен глобальный процесс обработки почты.`);
    logger.debug(`[Orchestration ID: ${process_id}] Параметры:`, { accountsCount: accounts.length, emailsCount: emails.length, limit, openRate, repliesCount });

    const allBrowserTasks: BrowserTask[] = []; // Собираем все задачи для браузера
    const tempDirectories: string[] = []; // Для отслеживания директорий, которые нужно очистить
    const browserProcessingReport = reportService.initializeReport(process_id, 'aggregate_browser', 'N/A');
    
    let browser: Browser | null = null; // Объявляем браузер здесь

    try {
      // Запускаем браузер один раз для всех аккаунтов
      browser = await browserInteractionService.launchBrowser(headlessBrowser);
      if (!browser) {
        logger.error(`[Orchestration ID: ${process_id}] Не удалось запустить браузер. Обработка продолжится без браузерных задач.`);
      }

      for (const account of accounts) {
        if (!account.email) {
          logger.warn(`[Orchestration ID: ${process_id}] Пропуск аккаунта без email: ID ${account.id}`);
          continue;
        }
        const providerConfig = getConfig(account.provider);
        if (!providerConfig) {
          logger.error(`[Orchestration ID: ${process_id}] Не найдена конфигурация для провайдера ${account.provider} аккаунта ${account.email}. Пропуск.`);
          continue;
        }

        for (const fromEmail of emails) {
          logger.info(`[Orchestration ID: ${process_id}] Подготовка к обработке для аккаунта ${account.email} от ${fromEmail}.`);

          // Создаем путь для временных файлов этого аккаунта
          const projectRoot = path.resolve(__dirname, '..',);
          const uniqueSubfolder = `${process_id}_${account.email.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
          const tempDirPath = path.join(projectRoot, baseOutputPath, uniqueSubfolder);
          tempDirectories.push(tempDirPath);

          const accountProcessingParams: AccountProcessingParams = {
            account,
            fromEmail,
            providerConfig,
            process_id,
            limit,
            openRatePercent: openRate,
            repliesToAttempt: repliesCount,
            baseOutputPath,
            headlessBrowser
          };

          try {
            // Используем await для последовательной обработки аккаунтов/писем
            const tasksFromAccount = await accountProcessingService.processAccountFromSender(accountProcessingParams);
            allBrowserTasks.push(...tasksFromAccount); // Добавляем задачи в общий список
            logger.info(`[Orchestration ID: ${process_id}] Получено ${tasksFromAccount.length} браузерных задач от аккаунта ${account.email}.`);
          } catch (accountProcessingError) {
            handleError(accountProcessingError, `[Orchestration ID: ${process_id}] Ошибка при обработке ${account.email} от ${fromEmail}:`);
          }
        }
      }

      // Обработка всех собранных задач в браузере ПОСЛЕ всех циклов
      if (allBrowserTasks.length > 0 && browser) {
        logger.info(`[Orchestration ID: ${process_id}] Запуск обработки ${allBrowserTasks.length} задач в браузере.`);
        await browserInteractionService.processTasksWithBrowser(browser, allBrowserTasks, openRate, browserProcessingReport);
        logger.info(`[Orchestration ID: ${process_id}] Завершена обработка ${allBrowserTasks.length} задач в браузере.`);
      } else {
        logger.info(`[Orchestration ID: ${process_id}] Нет задач для обработки в браузере или браузер недоступен.`);
      }
    } catch (orchestrationErr) {
      handleError(orchestrationErr, `[Orchestration ID: ${process_id}] Критическая ошибка в оркестрации:`);
    } finally {
      // Закрываем браузер в любом случае
      if (browser) {
        await browserInteractionService.closeBrowser(browser);
      }
      
      // Очищаем все временные директории
      for (const dirPath of tempDirectories) {
        try {
          await fileSystemService.cleanupDirectory(dirPath);
          logger.info(`[Orchestration ID: ${process_id}] Очищена временная директория ${dirPath}.`);
          
          // Пытаемся удалить пустую директорию
          try {
            await fs.promises.rmdir(dirPath);
            logger.info(`[Orchestration ID: ${process_id}] Удалена пустая директория ${dirPath}.`);
          } catch (rmdirErr) {
            handleError(rmdirErr, `[Orchestration ID: ${process_id}] Не удалось удалить директорию ${dirPath}`);
          }
        } catch (cleanupErr) {
          handleError(cleanupErr, `[Orchestration ID: ${process_id}] Ошибка при очистке директории ${dirPath}`);
        }
      }
      
      logger.info(`[Orchestration ID: ${process_id}] Завершение всего процесса обработки почты.`);
    }
  }
}

export const processOrchestrationService = new ProcessOrchestrationService();
