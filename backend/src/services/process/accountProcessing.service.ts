import { Account, ProviderConfig, AccountProcessingParams, ProcessConfig, } from '../../types/types';
import { logger } from '../../utils/logger';
import { handleError } from '../../utils/error-handler';
import { injectable, inject } from 'inversify';
import "reflect-metadata";
import { TYPES } from '../../common/types.di';

import { IImapClientService } from './client/imapClient.service';
import { ISpamHandlingService } from './mailbox/spamHandling.service';
import { ISearchMessagesService } from './email/searchMessages.service';
import { IEmailContentService } from './email/emailContent.service';
import { BrowserTask } from './browser/browserInteraction.service';
import { IReplyService } from './reply/reply.service';
import { IReportService } from './utils/report.service';
import { IMailboxDiscoveryService } from './mailbox/mailboxDiscovery.service';
import { IFileSystemService } from './utils/fileSystem.service';
import { ProcessReport } from '../../types/reports';
import { FetchMessageObject, ImapFlow } from 'imapflow';

export interface IAccountProcessingService {
  processAccountFromSender(params: AccountProcessingParams): Promise<BrowserTask[]>;
  finalizeAccountProcessing(userEmail: string, report: ProcessReport, providerConfig: ProviderConfig, fromEmail: string): Promise<void>;
}

@injectable()
export class AccountProcessingService implements IAccountProcessingService {
  constructor(
    @inject(TYPES.ImapClientService) private readonly imapClientService: IImapClientService,
    @inject(TYPES.SpamHandlingService) private readonly spamHandlingService: ISpamHandlingService,
    @inject(TYPES.SearchMessagesService) private readonly searchMessagesService: ISearchMessagesService,
    @inject(TYPES.EmailContentService) private readonly emailContentService: IEmailContentService,
    @inject(TYPES.ReplyService) private readonly replyService: IReplyService,
    @inject(TYPES.ReportService) private readonly reportService: IReportService,
    @inject(TYPES.MailboxDiscoveryService) private readonly mailboxDiscoveryService: IMailboxDiscoveryService,
    @inject(TYPES.FileSystemService) private readonly fileSystemService: IFileSystemService
  ) { }
  private client: ImapFlow | null = null;

  // Структура для хранения обнаруженных путей
  private discoveredMailboxPaths: {
    inbox?: string | null;
    sent?: string | null;
    drafts?: string | null;
    trash?: string | null;
    archive?: string | null;
    spam?: string | null;
    newsletters?: string[];
  } = {};

  private async _initializeImapConnection(account: Account, providerConfig: ProviderConfig): Promise<ImapFlow | null> {
    const userEmail = account.email;
    logger.debug(`[AccountProcessing] Initializing IMAP connection for: ${userEmail}`);
    const client = this.imapClientService.createImapClient(
      userEmail,
      providerConfig.host,
      account.is_token ? undefined : account.app_password || undefined,
      account.is_token ? account.access_token || undefined : undefined,
    );

    if (!(await this.imapClientService.connectClient(client, userEmail))) {
      logger.error(`[AccountProcessing] Failed to connect to IMAP for ${userEmail}.`, true);
      return null;
    }
    this.client = client
    return client;
  }

  private _prepareAccountEnvironment(tempDirPath: string, accountEmail: string, process_id: string): void {
    logger.debug(`[AccountProcessing] Preparing environment for account: ${accountEmail}, process_id: ${process_id}`);
    this.fileSystemService.createDirectoryIfNotExists(tempDirPath);
  }

  // Обновленный метод для обнаружения всех релевантных ящиков
  private async _discoverAllMailboxes(
    client: ImapFlow,
    account: Account,
  ): Promise<void> {
    const userEmail = account.email;
    const provider = account.provider;
    logger.debug(`[AccountProcessing] Discovering all mailboxes for: ${userEmail} (provider: ${provider})`);
    const params = { client, user: userEmail, provider, configuredPath: null };
    // Передаем null или undefined, так как старых путей в конфиге больше нет
    this.discoveredMailboxPaths.inbox = await this.mailboxDiscoveryService.findInboxMailbox(params);
    this.discoveredMailboxPaths.sent = await this.mailboxDiscoveryService.findSentMailbox(params);
    this.discoveredMailboxPaths.drafts = await this.mailboxDiscoveryService.findDraftMailbox(params);
    this.discoveredMailboxPaths.trash = await this.mailboxDiscoveryService.findTrashMailbox(params);

    this.discoveredMailboxPaths.spam = await this.mailboxDiscoveryService.findSpamMailbox(params);
    this.discoveredMailboxPaths.newsletters = await this.mailboxDiscoveryService.findNewsletterMailboxes(params);

    logger.info(`[AccountProcessing] Discovered mailboxes for ${userEmail}: ${JSON.stringify(this.discoveredMailboxPaths)}`, true);

    // Валидация критичного ящика Inbox
    if (!this.discoveredMailboxPaths.inbox) {
      logger.error(`[AccountProcessing] Critical error: Inbox mailbox not found for ${userEmail}. Aborting processing for this account.`, true);
      // Здесь можно бросить ошибку или установить флаг, чтобы прервать дальнейшую обработку этого аккаунта
      throw new Error(`Inbox not found for ${userEmail}`);
    }
  }

  private async _handleSpamFolders(client: ImapFlow, account: Account, providerConfig: ProviderConfig, fromEmail: string, report: ProcessReport): Promise<void> {
    logger.debug(`[AccountProcessing] Handling spam folders for: ${account.email}`);

    if (!this.discoveredMailboxPaths.inbox) {
      logger.warn(`[AccountProcessing] Inbox not found, cannot determine target for moving spam for ${account.email}. Skipping spam handling.`);
      return;
    }
    const spamMailboxPath = this.discoveredMailboxPaths.spam;
    if (!spamMailboxPath) {
      logger.info(`[AccountProcessing] No spam folder discovered for ${account.email}. Skipping spam handling.`, true);
      return;
    }

    const spamResult = await this.spamHandlingService.processAllSpamFolders(
      client,
      [spamMailboxPath],
      this.discoveredMailboxPaths.inbox,
      fromEmail
    );
    this.reportService.updateReportWithSpamStats(report, spamResult.totalSpamFound, spamResult.totalSpamMoved);
  }

  private async _processSingleEmail(
    message: FetchMessageObject,
    client: ImapFlow,
    userEmail: string,
    config: ProcessConfig,
    report: ProcessReport,
    tempDirPath: string,
    providerConfig: ProviderConfig,
    account: Account,
    remainingReplies: number
  ): Promise<{ browserTask: BrowserTask | null; updatedRemainingReplies: number }> {
    const savedEmailInfo = await this.emailContentService.saveEmailForBrowser(message, tempDirPath);
    let browserTask: BrowserTask | null = null;

    if (savedEmailInfo.filePath) {
      browserTask = {
        filePath: savedEmailInfo.filePath,
        linkToOpen: savedEmailInfo.extractedLink,
        uid: message.uid,
        subject: savedEmailInfo.subject
      };
    } else {
      this.reportService.updateReportWithEmailStats(report, 0, 0, `Failed to save email UID ${message.uid} for browser`);
    }

    let updatedRemainingReplies = remainingReplies;
    if (remainingReplies > 0) {
      updatedRemainingReplies = await this._manageReplies(
        message,
        userEmail,
        this.discoveredMailboxPaths.sent || null,
        this.discoveredMailboxPaths.drafts || null,
        report,
        remainingReplies,
        providerConfig,
        account,
        client,
        message.uid
      );
    }
    return { browserTask, updatedRemainingReplies };
  }

  private async _processMailbox(
    mailboxPath: string,
    client: ImapFlow,
    fromEmail: string,
    config: ProcessConfig,
    report: ProcessReport,
    account: Account,
    providerConfig: ProviderConfig,
    tempDirPath: string,
    initialRemainingReplies: number
  ): Promise<{ browserTasks: BrowserTask[], finalRemainingReplies: number }> {
    const userEmail = account.email;
    const browserTasks: BrowserTask[] = [];
    let currentRemainingReplies = initialRemainingReplies;

    const lock = await this.imapClientService.getMailboxLock(client, mailboxPath);
    if (!lock) {
      logger.warn(`[AccountProcessing] Failed to open mailbox ${mailboxPath} for ${userEmail}, skipping.`, true);
      this.reportService.updateReportWithEmailStats(report, 0, 0, `Failed to lock mailbox: ${mailboxPath}`);
      return { browserTasks, finalRemainingReplies: currentRemainingReplies };
    }

    try {
      const messageUids = await this.searchMessagesService.searchUnseenFromSender(client, fromEmail);
      this.reportService.updateReportWithEmailStats(report, messageUids.length);

      const uidsToProcess = messageUids.slice(0, config.limit);
      logger.info(`[AccountProcessing] Found ${messageUids.length} emails in ${mailboxPath}, will process ${uidsToProcess.length} (limit: ${config.limit})`, true);

      const messagesToMarkAsSeen: number[] = [];
      const messagesToMarkAsSeenSeq: number[] = [];

      for (const uid of uidsToProcess) {
        const message = await client.fetchOne(uid.toString(), { source: true, uid: true, envelope: true, headers: true }, { uid: true });
        if (!message) {
          logger.warn(`[AccountProcessing] Failed to fetch message UID ${uid} from ${mailboxPath}`, true);
          this.reportService.updateReportWithEmailStats(report, 0, 0, `Failed to fetch message UID ${uid}`);
          continue;
        }

        const { browserTask, updatedRemainingReplies: newRemainingReplies } = await this._processSingleEmail(
          message, client, userEmail, config, report, tempDirPath, providerConfig, account, currentRemainingReplies
        );
        currentRemainingReplies = newRemainingReplies;

        if (browserTask) {
          browserTasks.push(browserTask);
        }
        messagesToMarkAsSeen.push(uid);
        messagesToMarkAsSeenSeq.push(message.seq);

        if (config.minDelayBetweenEmailsMs && config.maxDelayBetweenEmailsMs) {
          const delay = Math.floor(Math.random() * (config.maxDelayBetweenEmailsMs - config.minDelayBetweenEmailsMs + 1)) + config.minDelayBetweenEmailsMs;
          logger.debug(`[AccountProcessing] Delaying for ${delay}ms (random between ${config.minDelayBetweenEmailsMs}ms and ${config.maxDelayBetweenEmailsMs}ms)`);
          await new Promise((r) => setTimeout(r, delay));
        } else if (config.minDelayBetweenEmailsMs) {
          logger.debug(`[AccountProcessing] Delaying for ${config.minDelayBetweenEmailsMs}ms (fixed)`);
          await new Promise((r) => setTimeout(r, config.minDelayBetweenEmailsMs));
        }
      }

      if (messagesToMarkAsSeen.length > 0) {
        logger.info(`[AccountProcessing] Marking ${messagesToMarkAsSeen.length} emails as read in ${mailboxPath}`, true);
        // await client.messageFlagsSet(messagesToMarkAsSeen, ['\\Seen'], { uid: true });
        // await client.messageFlagsAdd(messagesToMarkAsSeen, ['\\Seen'], { uid: true });
        for (const messageToSeen of messagesToMarkAsSeen) {
          // await client.messageFlagsSet(messageToSeen.toString(), ['\\Seen'], { uid: true });
          await client.messageFlagsAdd(messageToSeen.toString(), ['\\Seen'], { uid: true });
        }
        for (const messageToSeen of messagesToMarkAsSeenSeq) {
          // await client.messageFlagsSet(messageToSeen.toString(), ['\\Seen'], { uid: true });
          await client.messageFlagsAdd(messageToSeen.toString(), ['\\Seen'],);
        }
      }

    } catch (mailboxErr) {
      const errMsg = `Error processing mailbox ${mailboxPath} for ${userEmail}: ${mailboxErr instanceof Error ? mailboxErr.message : String(mailboxErr)}`;
      handleError(mailboxErr, errMsg, 'processAccountFromSender.mailboxLoop');
      this.reportService.updateReportWithEmailStats(report, 0, 0, errMsg);
    } finally {
      await this.imapClientService.releaseMailboxLock(lock, mailboxPath);
    }
    return { browserTasks, finalRemainingReplies: currentRemainingReplies };
  }

  public async finalizeAccountProcessing(userEmail: string, report: ProcessReport, providerConfig: ProviderConfig, fromEmail: string): Promise<void> {
    this.reportService.finalizeReportStatus(report);
    // Используем обнаруженный inbox для отчета, если он есть, иначе N/A
    const processedMailboxForReport = this.discoveredMailboxPaths.inbox || 'N/A';
    await this.reportService.submitReport(report, processedMailboxForReport);
    if (this.client) {
      await this.imapClientService.disconnectClient(this.client, userEmail);
      logger.info(`[AccountProcessing] Finalized IMAP/SMTP processing for: ${userEmail}, sender: ${fromEmail}`, true);
    }
  }

  private async _manageReplies(
    message: FetchMessageObject,
    userEmail: string,
    sentMailboxPath: string | null,
    draftMailboxPath: string | null,
    report: ProcessReport,
    remainingReplies: number,
    providerConfig: ProviderConfig,
    account: Account,
    client: ImapFlow,
    uid: number
  ): Promise<number> {
    const preparedReply = await this.replyService.prepareReply(message, userEmail);
    if (!preparedReply.mimeBuffer || !preparedReply.emailContent) {
      logger.warn(`[AccountProcessing] Не удалось подготовить ответ для UID ${uid}.`, true);
      return remainingReplies;
    }

    const smtpSent = await this.replyService.sendSmtpEmail(
      preparedReply.emailContent,
      providerConfig.smtpHost,
      { password: account.app_password || undefined, token: account.access_token || undefined }
    );
    this.reportService.updateReportWithReplyStats(report, smtpSent);
    if (smtpSent) {
      remainingReplies--;
      if (sentMailboxPath) {
        await this.replyService.appendEmailToMailbox(client, sentMailboxPath, preparedReply.mimeBuffer, account.provider, ['\\Seen']);
      }
    } else {
      if (draftMailboxPath) {
        remainingReplies--;
        await this.replyService.appendEmailToMailbox(client, draftMailboxPath, preparedReply.mimeBuffer, account.provider, ['\\Draft', '\\Seen']);
        logger.info(`[AccountProcessing] Ответ на UID ${uid} сохранен в черновики из-за ошибки SMTP.`);
      }
    }
    return remainingReplies;
  }

  public async processAccountFromSender(params: AccountProcessingParams): Promise<BrowserTask[]> {
    const {
      account,
      fromEmail,
      providerConfig,
      process_id,
      config,
      report,
      tempDirPath
    } = params;

    const userEmail = account.email;
    logger.info(`[AccountProcessing] Start processing for account: ${userEmail}, sender: ${fromEmail}, process_id: ${process_id}`, true);

    // Обнуляем discoveredMailboxPaths для каждого нового аккаунта
    this.discoveredMailboxPaths = {};

    const client = await this._initializeImapConnection(account, providerConfig);
    if (!client) {
      this.reportService.updateReportWithEmailStats(report, 0, 0, "IMAP connection failed");
      this.reportService.finalizeReportStatus(report);
      await this.reportService.submitReport(report, 'Connection Failed');
      return [];
    }
    this.client = client; // Убедимся что this.client установлен после успешного соединения

    this._prepareAccountEnvironment(tempDirPath, userEmail, process_id);

    try {
      await this._discoverAllMailboxes(client, account,); // Обнаружение всех ящиков
    } catch (discoveryError) {
      logger.error(`[AccountProcessing] Mailbox discovery failed for ${userEmail}: ${discoveryError instanceof Error ? discoveryError.message : String(discoveryError)}. Aborting.`, true);
      this.reportService.updateReportWithEmailStats(report, 0, 0, `Mailbox discovery failed: ${discoveryError instanceof Error ? discoveryError.message : String(discoveryError)}`);
      this.reportService.finalizeReportStatus(report);
      await this.reportService.submitReport(report, 'Discovery Failed');
      if (this.client) {
        await this.imapClientService.disconnectClient(this.client, userEmail);
      }
      return [];
    }

    // Inbox должен быть найден, иначе _discoverAllMailboxes выбросит ошибку
    const inboxPath = this.discoveredMailboxPaths.inbox!;

    await this._handleSpamFolders(client, account, providerConfig, fromEmail, report);

    const allBrowserTasks: BrowserTask[] = [];
    let overallRemainingReplies = config.repliesCount;

    // Основной цикл теперь по обнаруженному Inbox
    logger.info(`[AccountProcessing] Processing main inbox: ${inboxPath} for ${userEmail}`);
    const { browserTasks: inboxTasks, finalRemainingReplies: repliesAfterInbox } = await this._processMailbox(
      inboxPath,
      client,
      fromEmail,
      config,
      report,
      account,
      providerConfig, // передаем для smtpHost и других не-путевых настроек
      tempDirPath,
      overallRemainingReplies
    );
    allBrowserTasks.push(...inboxTasks);
    overallRemainingReplies = repliesAfterInbox;

    // Дополнительно обрабатываем папки рассылок, если они есть
    if (this.discoveredMailboxPaths.newsletters && this.discoveredMailboxPaths.newsletters.length > 0) {
      for (const newsletterMailbox of this.discoveredMailboxPaths.newsletters) {
        if (overallRemainingReplies <= 0 && config.repliesCount > 0) { // Если все ответы уже сделаны
          logger.info(`[AccountProcessing] All replies sent, skipping further newsletter mailboxes for ${userEmail}.`);
          break;
        }
        logger.info(`[AccountProcessing] Processing newsletter mailbox: ${newsletterMailbox} for ${userEmail}`);
        const { browserTasks: newsletterTasks, finalRemainingReplies: repliesAfterNewsletter } = await this._processMailbox(
          newsletterMailbox,
          client,
          fromEmail,
          config,
          report,
          account,
          providerConfig,
          tempDirPath,
          overallRemainingReplies
        );
        allBrowserTasks.push(...newsletterTasks);
        overallRemainingReplies = repliesAfterNewsletter;
      }
    }

    // await this._finalizeAccountProcessing(client, userEmail, report, providerConfig, fromEmail); // this.client используется внутри
    return allBrowserTasks;
  }
}
