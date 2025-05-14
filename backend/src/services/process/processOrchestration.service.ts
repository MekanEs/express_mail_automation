import { StartProcessingParams } from '../../types/types';
import { getConfig } from '../../utils/getConfig';
import { logger } from '../../utils/logger';
import { handleError } from '../../utils/error-handler';
import { accountProcessingService, AccountProcessingParams } from './accountProcessing.service';
import { Browser } from 'puppeteer';
import { browserInteractionService, BrowserTask } from './browser/browserInteraction.service';
import { reportService } from './utils/report.service';
import { fileSystemService } from './utils/fileSystem.service';
import { manageDirectories } from './utils/manageDirectories';

export class ProcessOrchestrationService {
  public async startEmailProcessing(params: StartProcessingParams): Promise<void> {
    const {
      accounts,
      emails,
      limit = 100,
      openRate = 70,
      repliesCount = 0,
      process_id,
      baseOutputPath,
    } = params;

    logger.info(`[Orchestration ID: ${process_id}] Запущен процесс обработки почты.`);

    const tempDirectories: string[] = [];
    let browser: Browser | null = null;

    try {
      browser = await browserInteractionService.launchBrowser();

      for (const account of accounts) {
        const providerConfig = getConfig(account.provider);

        const report = reportService.initializeReport(process_id, account.email, emails.join(' ,'));
        const allBrowserTasks: BrowserTask[] = [];

        for (const fromEmail of emails) {
          const tempDirPath = manageDirectories(__dirname, tempDirectories, process_id, account.email, baseOutputPath)

          const accountProcessingParams: AccountProcessingParams = {
            account,
            fromEmail,
            providerConfig,
            process_id,
            limit,
            repliesToAttempt: repliesCount,
            report,
            tempDirPath
          };

          try {
            const tasksFromAccount = await accountProcessingService.processAccountFromSender(accountProcessingParams);
            allBrowserTasks.push(...tasksFromAccount);
          } catch (accountProcessingError) {
            handleError(accountProcessingError, `[Orchestration ID: ${process_id}] Ошибка при обработке ${account.email} от ${fromEmail}:`);
          }
        }
        if (allBrowserTasks.length > 0 && browser) {
          await browserInteractionService.processTasksWithBrowser(browser, allBrowserTasks, openRate, report, providerConfig.mailboxes.join(', '));
          logger.info(`[Orchestration ID: ${process_id}] Завершена обработка ${allBrowserTasks.length} задач в браузере.`);
        } else {
          logger.info(`[Orchestration ID: ${process_id}] Нет задач для обработки в браузере или браузер недоступен.`);
        }
      }

    }
    catch (orchestrationErr) {
      handleError(orchestrationErr, `[Orchestration ID: ${process_id}] Критическая ошибка в оркестрации:`);
    }
    finally {
      if (browser) {
        await browserInteractionService.closeBrowser(browser);
      }

      await fileSystemService.cleanUpTempDirectory(tempDirectories, process_id)

      logger.info(`[Orchestration ID: ${process_id}] Завершение всего процесса обработки почты.`);
    }
  }
}

export const processOrchestrationService = new ProcessOrchestrationService();
