import { StartProcessingParams, AccountProcessingParams, } from '../../types/types';
import { getConfig } from '../../utils/getConfig';
import { logger } from '../../utils/logger';
import { handleError } from '../../utils/error-handler';
import { Browser } from 'puppeteer';
import { BrowserTask } from './browser/browserInteraction.service';
import { manageDirectories } from './utils/manageDirectories';
import { ProcessReport } from '../../types/reports';
import { injectable, inject } from 'inversify';
import "reflect-metadata";
import { TYPES } from '../../common/types.di';

import { IAccountProcessingService } from './accountProcessing.service';
import { IBrowserInteractionService } from './browser/browserInteraction.service';
import { IReportService } from './utils/report.service';
import { IFileSystemService } from './utils/fileSystem.service';

export interface IProcessOrchestrationService {
  startEmailProcessing(params: StartProcessingParams): Promise<void>;
}

@injectable()
export class ProcessOrchestrationService implements IProcessOrchestrationService {
  constructor(
    @inject(TYPES.AccountProcessingService) private readonly accountProcessingService: IAccountProcessingService,
    @inject(TYPES.BrowserInteractionService) private readonly browserInteractionService: IBrowserInteractionService,
    @inject(TYPES.ReportService) private readonly reportService: IReportService,
    @inject(TYPES.FileSystemService) private readonly fileSystemService: IFileSystemService
  ) { }

  public async startEmailProcessing(params: StartProcessingParams): Promise<void> {
    const {
      accounts,
      emails,
      process_id,
      baseOutputPath,
      config,
    } = params;

    logger.info(`[Orchestration ID: ${process_id}] Запущен процесс обработки почты.`);

    const tempDirectories: string[] = [];
    let browser: Browser | null = null;

    try {
      browser = await this.browserInteractionService.launchBrowser(false);

      for (const account of accounts) {
        const providerConfig = getConfig(account.provider);
        const report: ProcessReport = this.reportService.initializeReport(process_id, account.email, emails.join(' ,'));

        const allBrowserTasksForAccount: BrowserTask[] = [];

        for (const fromEmail of emails) {
          const tempDirPath = manageDirectories(__dirname, tempDirectories, process_id, account.email, baseOutputPath)

          const accountProcessingParams: AccountProcessingParams = {
            account,
            fromEmail,
            providerConfig,
            process_id,
            config,
            report,
            tempDirPath
          };

          try {
            const tasksFromSender = await this.accountProcessingService.processAccountFromSender(accountProcessingParams);
            allBrowserTasksForAccount.push(...tasksFromSender);
          } catch (accountProcessingError) {
            handleError(accountProcessingError, `[Orchestration ID: ${process_id}] Ошибка при обработке ${account.email} от ${fromEmail}:`);
          }
        }
        if (allBrowserTasksForAccount.length > 0 && browser) {
          await this.browserInteractionService.processTasksWithBrowser(browser, allBrowserTasksForAccount, config.openRate, report);
          logger.info(`[Orchestration ID: ${process_id}, Account: ${account.email}] Завершена обработка ${allBrowserTasksForAccount.length} задач в браузере.`);
        } else {
          logger.info(`[Orchestration ID: ${process_id}, Account: ${account.email}] Нет задач для обработки в браузере или браузер недоступен.`);
        }
        await this.accountProcessingService.finalizeAccountProcessing(account.email, report, providerConfig, emails.join(', '))
      }

    }
    catch (orchestrationErr) {
      handleError(orchestrationErr, `[Orchestration ID: ${process_id}] Критическая ошибка в оркестрации:`);
    }
    finally {
      if (browser) {
        await this.browserInteractionService.closeBrowser(browser);
      }

      await this.fileSystemService.cleanUpTempDirectory(tempDirectories, process_id)

      logger.info(`[Orchestration ID: ${process_id}] Завершение всего процесса обработки почты.`);
    }
  }
}

