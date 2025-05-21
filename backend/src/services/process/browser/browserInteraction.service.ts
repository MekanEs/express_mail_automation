import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { ProcessReport } from '../../../types/reports';
import { logger } from '../../../utils/logger';
import { handleError } from '../../../utils/error-handler';
// import { fileSystemService } from '../utils/fileSystem.service'; // To be injected
// import { reportService } from '../utils/report.service'; // To be injected
import puppeteer from 'puppeteer-extra';
import { Browser, LaunchOptions, Page } from 'puppeteer';
import { injectable, inject } from 'inversify';
import "reflect-metadata";
import { TYPES } from '../../../common/types.di';
import { IFileSystemService } from '../utils/fileSystem.service';
import { IReportService } from '../utils/report.service'; // Assuming this will be created
import { IImapClientService } from '../client/imapClient.service';

puppeteer.use(StealthPlugin());

export interface BrowserTask {
  filePath: string;
  linkToOpen?: string | null;
  uid: number;
  subject?: string | null;
}

export interface IBrowserInteractionService {
  launchBrowser(headless: boolean | undefined): Promise<Browser | null>;
  closeBrowser(browser: Browser | null): Promise<void>;
  processTasksWithBrowser(
    browser: Browser | null,
    tasks: BrowserTask[],
    openRatePercent: number, // Процент писем, для которых нужно открывать ссылки
    report: ProcessReport,
  ): Promise<void>;
}

@injectable()
export class BrowserInteractionService implements IBrowserInteractionService {
  private readonly fileSystemService: IFileSystemService;
  private readonly reportService: IReportService; // Assuming IReportService

  constructor(
    @inject(TYPES.ImapClientService) private readonly imapClientService: IImapClientService,
    @inject(TYPES.FileSystemService) fileSystemService: IFileSystemService,
    @inject(TYPES.ReportService) reportService: IReportService // Assuming TYPES.ReportService
  ) {
    this.fileSystemService = fileSystemService;
    this.reportService = reportService;
  }

  public async launchBrowser(headless: boolean | undefined = false): Promise<Browser | null> {
    // headless: true - старый headless
    // headless: false - для отладки
    const options: LaunchOptions = {
      headless: headless, // Тип теперь boolean | undefined
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    };
    try {
      logger.debug(`[Browser Service] Запуск браузера Puppeteer (headless: ${headless})...`, true);
      const browser = await puppeteer.launch(options);
      logger.info(`[Browser Service] Браузер Puppeteer успешно запущен.`, true);
      return browser;
    } catch (err) {
      handleError(err, '[Browser Service] Ошибка при запуске браузера Puppeteer', 'launchBrowser');
      return null;
    }
  }

  public async closeBrowser(browser: Browser | null): Promise<void> {
    if (browser && browser.connected) {
      try {
        logger.debug('[Browser Service] Закрытие браузера Puppeteer...');
        await browser.close();
        logger.info('[Browser Service] Браузер Puppeteer успешно закрыт.', true);
      } catch (err) {
        handleError(err, '[Browser Service] Ошибка при закрытии браузера Puppeteer', 'closeBrowser');
      }
    } else {
      logger.debug('[Browser Service] Браузер не был запущен или уже закрыт.', true);
    }
  }

  private async openLocalEmailPage(page: Page, task: BrowserTask, report: ProcessReport): Promise<void> {
    try {
      await page.goto(`file://${task.filePath}`, { // Важно: file:// для локальных файлов
        waitUntil: 'networkidle2',
        timeout: 20000,
      });
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); // Прокрутка


      this.reportService.updateReportWithEmailStats(report, 0, 1); // emails_processed инкрементируется
      await new Promise(r => setTimeout(r, Math.floor(Math.random() * 1500) + 500)); // Случайная задержка
      logger.debug(`[Browser Service] Локальный файл письма ${task.filePath} (UID: ${task.uid}) успешно открыт и просмотрен.`);



    } catch (err) {
      const errorMessage = `Ошибка при открытии локального файла ${task.filePath} (UID: ${task.uid}): ${err instanceof Error ? err.message : err}`;
      handleError(err, errorMessage, 'openLocalEmailPage');
      this.reportService.updateReportWithEmailStats(report, 0, 0, errorMessage); // emails_errors инкрементируется
    } finally {
      this.fileSystemService.deleteFile(task.filePath); // Удаляем временный HTML файл
    }
  }

  private async openExternalLinkPage(page: Page, task: BrowserTask, report: ProcessReport): Promise<void> {
    if (!task.linkToOpen) {
      logger.debug(`[Browser Service] Нет ссылки для открытия для письма UID: ${task.uid}.`);
      return;
    }
    logger.debug(`[Browser Service] Попытка открытия внешней ссылки: ${task.linkToOpen} (из письма UID: ${task.uid})`);
    this.reportService.updateReportWithLinkStats(report, 1); // links_attemptedOpen

    try {
      await page.goto(task.linkToOpen, {
        waitUntil: 'networkidle2',
        timeout: 30000, // Таймаут для внешних ссылок может быть больше
      });
      await new Promise(r => setTimeout(r, Math.floor(Math.random() * 2000) + 1000)); // Случайная задержка

      this.reportService.updateReportWithLinkStats(report, 0, 1); // links_targetOpen
      logger.info(`[Browser Service] Внешняя ссылка ${task.linkToOpen} (UID: ${task.uid}) успешно открыта.`, true);
    } catch (err) {
      const errorMessage = `Ошибка при открытии внешней ссылки ${task.linkToOpen} (UID: ${task.uid}): ${err instanceof Error ? err.message : err}`;
      handleError(err, errorMessage, 'openExternalLinkPage');
      this.reportService.updateReportWithLinkStats(report, 0, 0, errorMessage); // links_errors
    }
  }


  public async processTasksWithBrowser(
    browser: Browser | null,
    tasks: BrowserTask[],
    openRatePercent: number, // Процент писем, для которых нужно открывать ссылки
    report: ProcessReport,
  ): Promise<void> {
    if (!tasks || tasks.length === 0) {
      logger.debug('[Browser Service] Нет задач для обработки в браузере.');
      return;
    }

    if (!browser) {
      logger.error('[Browser Service] Экземпляр браузера не передан, обработка задач прервана.', true);
      tasks.forEach(task => {
        this.reportService.updateReportWithEmailStats(report, 0, 0, `Browser instance not available for UID ${task.uid}`);
        if (task.filePath) this.fileSystemService.deleteFile(task.filePath); // Очистка, если файл был создан
      });
      return;
    }

    let linksToOpenCount = Math.ceil((tasks.length * openRatePercent) / 100);
    logger.info(`[Browser Service] Всего задач: ${tasks.length}. Планируется открыть ссылок: ${linksToOpenCount}.`, true);

    try {
      for (const task of tasks) {
        const emailPage = await browser.newPage();
        await this.configurePage(emailPage);
        await this.openLocalEmailPage(emailPage, task, report);
        await emailPage.close();

        if (task.linkToOpen && linksToOpenCount > 0) {
          const linkPage = await browser.newPage();
          await this.configurePage(linkPage);
          await this.openExternalLinkPage(linkPage, task, report);
          await linkPage.close();
          linksToOpenCount--;
        }
        // Небольшая пауза между обработкой задач
        await new Promise(r => setTimeout(r, Math.floor(Math.random() * 500) + 200));
      }
    } catch (err) {
      // Общая ошибка цикла обработки задач
      handleError(err, '[Browser Service] Критическая ошибка в цикле обработки задач браузера', 'processTasksWithBrowser');
      // Можно добавить обновление отчета общей ошибкой
      this.reportService.updateReportWithEmailStats(report, 0, 0, `Browser task processing loop failed: ${err instanceof Error ? err.message : err}`);
    }
    // Не закрываем браузер здесь - это теперь ответственность вызывающего кода
  }

  private async configurePage(page: Page): Promise<void> {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    // Можно добавить другие настройки страницы, например, viewport
    // await page.setViewport({ width: 1280, height: 800 });
  }
}
