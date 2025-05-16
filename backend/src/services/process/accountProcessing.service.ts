import { Account, ProviderConfig, AccountProcessingParams, ProcessConfig } from '../../types/types';
import { logger } from '../../utils/logger';
import { handleError } from '../../utils/error-handler';
import { imapClientService } from './client/imapClient.service';
import { spamHandlingService } from './mailbox/spamHandling.service';
import { searchMessagesService } from './email/searchMessages.service';
import { emailContentService } from './email/emailContent.service';
import { BrowserTask } from './browser/browserInteraction.service';
import { replyService } from './reply/reply.service';
import { reportService } from './utils/report.service';
import { mailboxDiscoveryService } from './mailbox/mailboxDiscovery.service';
import { fileSystemService } from './utils/fileSystem.service';
import { ProcessReport } from '../../types/reports';
import { FetchMessageObject, ImapFlow } from 'imapflow';


export class AccountProcessingService {
  private async _initializeImapConnection(account: Account, providerConfig: ProviderConfig): Promise<ImapFlow | null> {
    const userEmail = account.email;
    logger.info(`[AccountProcessing] Initializing IMAP connection for: ${userEmail}`);
    const client = imapClientService.createImapClient(
      userEmail,
      providerConfig.host,
      account.is_token ? undefined : account.app_password || undefined,
      account.is_token ? account.access_token || undefined : undefined,
    );

    if (!(await imapClientService.connectClient(client, userEmail))) {
      logger.error(`[AccountProcessing] Failed to connect to IMAP for ${userEmail}.`);
      // Reporting will be handled by the main orchestrator method
      return null;
    }
    return client;
  }

  private _prepareAccountEnvironment(tempDirPath: string, accountEmail: string, process_id: string): void {
    logger.info(`[AccountProcessing] Preparing environment for account: ${accountEmail}, process_id: ${process_id}`);
    fileSystemService.createDirectoryIfNotExists(tempDirPath);
  }

  private async _discoverMailboxes(client: ImapFlow, userEmail: string): Promise<{ sentMailboxPath: string | null; draftMailboxPath: string | null }> {
    logger.info(`[AccountProcessing] Discovering mailboxes for: ${userEmail}`);
    const sentMailboxPath = await mailboxDiscoveryService.findSentMailbox(client, userEmail);
    const draftMailboxPath = await mailboxDiscoveryService.findDraftMailbox(client, userEmail);
    return { sentMailboxPath, draftMailboxPath };
  }

  private async _handleSpamFolders(client: ImapFlow, providerConfig: ProviderConfig, fromEmail: string, report: ProcessReport): Promise<void> {
    logger.info(`[AccountProcessing] Handling spam folders for: ${fromEmail}`);
    const spamResult = await spamHandlingService.processAllSpamFolders(
      client,
      providerConfig.spam,
      providerConfig.mailboxes[0], // Assuming the first mailbox is a primary one for context, this might need review
      fromEmail
    );
    reportService.updateReportWithSpamStats(report, spamResult.totalSpamFound, spamResult.totalSpamMoved);
  }

  private async _processSingleEmail(
    message: FetchMessageObject,
    client: ImapFlow,
    userEmail: string,
    sentMailboxPath: string | null,
    draftMailboxPath: string | null,
    config: ProcessConfig,
    report: ProcessReport,
    tempDirPath: string,
    providerConfig: ProviderConfig,
    account: Account,
    remainingReplies: number
  ): Promise<{ browserTask: BrowserTask | null; updatedRemainingReplies: number }> {
    const savedEmailInfo = await emailContentService.saveEmailForBrowser(message, tempDirPath);
    let browserTask: BrowserTask | null = null;

    if (savedEmailInfo.filePath) {
      browserTask = {
        filePath: savedEmailInfo.filePath,
        linkToOpen: savedEmailInfo.extractedLink,
        uid: message.uid,
        subject: savedEmailInfo.subject
      };
    } else {
      reportService.updateReportWithEmailStats(report, 0, 0, `Failed to save email UID ${message.uid} for browser`);
    }

    let updatedRemainingReplies = remainingReplies;
    if (remainingReplies > 0) {
      updatedRemainingReplies = await this.manageReplies(
        message,
        userEmail,
        sentMailboxPath,
        draftMailboxPath,
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
    sentMailboxPath: string | null,
    draftMailboxPath: string | null,
    tempDirPath: string,
    initialRemainingReplies: number
  ): Promise<{ browserTasks: BrowserTask[], finalRemainingReplies: number }> {
    const userEmail = account.email;
    const browserTasks: BrowserTask[] = [];
    let currentRemainingReplies = initialRemainingReplies;

    const lock = await imapClientService.getMailboxLock(client, mailboxPath);
    if (!lock) {
      logger.warn(`[AccountProcessing] Failed to open mailbox ${mailboxPath} for ${userEmail}, skipping.`);
      reportService.updateReportWithEmailStats(report, 0, 0, `Failed to lock mailbox: ${mailboxPath}`);
      return { browserTasks, finalRemainingReplies: currentRemainingReplies };
    }

    try {
      const messageUids = await searchMessagesService.searchUnseenFromSender(client, fromEmail);
      reportService.updateReportWithEmailStats(report, messageUids.length);

      const uidsToProcess = messageUids.slice(0, config.limit);
      logger.info(`[AccountProcessing] Found ${messageUids.length} emails in ${mailboxPath}, will process ${uidsToProcess.length} (limit: ${config.limit})`);

      const messagesToMarkAsSeen: number[] = [];

      for (const uid of uidsToProcess) {
        const message = await client.fetchOne(uid.toString(), { source: true, uid: true, envelope: true, headers: true }, { uid: true });
        if (!message) {
          logger.warn(`[AccountProcessing] Failed to fetch message UID ${uid} from ${mailboxPath}`);
          reportService.updateReportWithEmailStats(report, 0, 0, `Failed to fetch message UID ${uid}`);
          continue;
        }

        const { browserTask, updatedRemainingReplies } = await this._processSingleEmail(
          message, client, userEmail, sentMailboxPath, draftMailboxPath, config, report, tempDirPath, providerConfig, account, currentRemainingReplies
        );

        currentRemainingReplies = updatedRemainingReplies;
        if (browserTask) {
          browserTasks.push(browserTask);
        }
        messagesToMarkAsSeen.push(uid);

        // Configurable delay
        if (config.minDelayBetweenEmailsMs && config.maxDelayBetweenEmailsMs) {
          const delay = Math.floor(Math.random() * (config.maxDelayBetweenEmailsMs - config.minDelayBetweenEmailsMs + 1)) + config.minDelayBetweenEmailsMs;
          logger.info(`[AccountProcessing] Delaying for ${delay}ms (random between ${config.minDelayBetweenEmailsMs}ms and ${config.maxDelayBetweenEmailsMs}ms)`);
          await new Promise((r) => setTimeout(r, delay));
        } else if (config.minDelayBetweenEmailsMs) {
          logger.info(`[AccountProcessing] Delaying for ${config.minDelayBetweenEmailsMs}ms (fixed)`);
          await new Promise((r) => setTimeout(r, config.minDelayBetweenEmailsMs));
        }
      }

      if (messagesToMarkAsSeen.length > 0) {
        logger.info(`[AccountProcessing] Marking ${messagesToMarkAsSeen.length} emails as read in ${mailboxPath}`);
        await client.messageFlagsAdd(messagesToMarkAsSeen, ['\\Seen'], { uid: true });
      }

    } catch (mailboxErr) {
      const errMsg = `Error processing mailbox ${mailboxPath} for ${userEmail}: ${mailboxErr instanceof Error ? mailboxErr.message : String(mailboxErr)}`;
      handleError(mailboxErr, errMsg, 'processAccountFromSender.mailboxLoop');
      reportService.updateReportWithEmailStats(report, 0, 0, errMsg);
    } finally {
      await imapClientService.releaseMailboxLock(lock, mailboxPath);
    }
    return { browserTasks, finalRemainingReplies: currentRemainingReplies };
  }

  private async _finalizeAccountProcessing(client: ImapFlow, userEmail: string, report: ProcessReport, providerConfig: ProviderConfig, fromEmail: string): Promise<void> {
    reportService.finalizeReportStatus(report);
    await reportService.submitReport(report, providerConfig.mailboxes.join(', ')); // Added submitReport here
    await imapClientService.disconnectClient(client, userEmail);
    logger.info(`[AccountProcessing] Finalized IMAP/SMTP processing for: ${userEmail}, sender: ${fromEmail}`);
  }

  private async manageReplies(
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
  ) {
    const preparedReply = await replyService.prepareReply(message, userEmail);
    if (!preparedReply.mimeBuffer || !preparedReply.emailContent) {
      logger.warn(`[AccountProcessing] Не удалось подготовить ответ для UID ${uid}.`);
      return remainingReplies
    }

    const smtpSent = await replyService.sendSmtpEmail(
      preparedReply.emailContent,
      providerConfig.smtpHost,
      { password: account.app_password || undefined, token: account.access_token || undefined }
    );
    reportService.updateReportWithReplyStats(report, smtpSent);
    if (smtpSent) {
      remainingReplies--;
      if (sentMailboxPath) {
        await replyService.appendEmailToMailbox(client, sentMailboxPath, preparedReply.mimeBuffer, ['\\Seen'], account.provider);
      }
    } else {
      if (draftMailboxPath) {
        remainingReplies--;
        await replyService.appendEmailToMailbox(client, draftMailboxPath, preparedReply.mimeBuffer, ['\\Draft', '\\Seen'], account.provider);
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
    logger.info(`[AccountProcessing] Start processing for account: ${userEmail}, sender: ${fromEmail}, process_id: ${process_id}`);

    const client = await this._initializeImapConnection(account, providerConfig);
    if (!client) {
      reportService.updateReportWithEmailStats(report, 0, 0, "IMAP connection failed");
      reportService.finalizeReportStatus(report);
      await reportService.submitReport(report, providerConfig.mailboxes.join(', '));
      return [];
    }

    this._prepareAccountEnvironment(tempDirPath, userEmail, process_id);

    let remainingReplies = config.repliesCount;
    const allBrowserTasks: BrowserTask[] = [];

    try {
      const { sentMailboxPath, draftMailboxPath } = await this._discoverMailboxes(client, userEmail);
      await this._handleSpamFolders(client, providerConfig, fromEmail, report);

      for (const mailboxPath of providerConfig.mailboxes) {
        const { browserTasks: mailboxBrowserTasks, finalRemainingReplies } = await this._processMailbox(
          mailboxPath,
          client,
          fromEmail,
          config,
          report,
          account,
          providerConfig,
          sentMailboxPath,
          draftMailboxPath,
          tempDirPath,
          remainingReplies
        );
        allBrowserTasks.push(...mailboxBrowserTasks);
        remainingReplies = finalRemainingReplies; // Update remaining replies after processing each mailbox
      }
    } catch (generalErr) {
      const errMsg = `General error processing account ${userEmail}: ${generalErr instanceof Error ? generalErr.message : String(generalErr)}`;
      handleError(generalErr, errMsg, 'processAccountFromSender');
      reportService.updateReportWithEmailStats(report, 0, 0, errMsg);
    } finally {
      // Finalize and submit report, then disconnect client
      // The submitReport was moved here to ensure it's always called before disconnect.
      // Original _finalizeAccountProcessing also contained submitReport, which is fine as it handles success path.
      // Here we handle both success and general error paths before disconnect.
      await this._finalizeAccountProcessing(client, userEmail, report, providerConfig, fromEmail);
    }

    logger.info(`[AccountProcessing] Finished processing for: ${userEmail}, sender: ${fromEmail}. Total browser tasks: ${allBrowserTasks.length}`);
    return allBrowserTasks;
  }
}

export const accountProcessingService = new AccountProcessingService();
