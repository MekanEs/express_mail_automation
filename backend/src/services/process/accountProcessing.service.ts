import { Account, ProviderConfig } from '../../types/types';
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
import path from 'path';
import { ProcessReport } from '../../types/reports';


export interface AccountProcessingParams {
  account: Account;
  fromEmail: string;
  providerConfig: ProviderConfig;
  process_id: string;
  limit: number;
  openRatePercent: number;
  repliesToAttempt: number;
  baseOutputPath: string;
  report: ProcessReport
}

export class AccountProcessingService {
  public async processAccountFromSender(params: AccountProcessingParams): Promise<BrowserTask[]> {
    const {
      account,
      fromEmail,
      providerConfig,
      process_id,
      limit,
      repliesToAttempt,
      baseOutputPath,
      report
    } = params;

    const userEmail = account.email;
    if (!userEmail) {
      logger.error(`[AccountProcessing] Аккаунт ID ${account.id} не имеет email адреса. Обработка пропущена.`);
      return [];
    }

    logger.info(`[AccountProcessing] Начало обработки для аккаунта: ${userEmail}, отправитель: ${fromEmail}, process_id: ${process_id}`);

    const client = imapClientService.createImapClient(
      userEmail,
      providerConfig.host,
      account.is_token ? undefined : account.app_password || undefined,
      account.is_token ? account.access_token || undefined : undefined
    );

    if (!(await imapClientService.connectClient(client, userEmail))) {
      logger.error(`[AccountProcessing] Не удалось подключиться к IMAP для ${userEmail}. Обработка прервана.`);
      reportService.updateReportWithEmailStats(report, 0, 0, "IMAP connection failed");
      reportService.finalizeReportStatus(report);
      await reportService.submitReport(report, providerConfig.mailboxes.join(', '));
      return [];
    }

    const projectRoot = path.resolve(__dirname, '..', '..', '..');
    // Создаем ПОЛНЫЙ путь к папке для временных файлов этого запуска
    const uniqueSubfolder = `${process_id}_${userEmail.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
    const tempDirPath = path.join(projectRoot, baseOutputPath, uniqueSubfolder);
    fileSystemService.createDirectoryIfNotExists(tempDirPath);

    let remainingReplies = repliesToAttempt;
    const browserTasks: BrowserTask[] = []; // Задачи для браузера, которые мы вернем

    try {
      const sentMailboxPath = await mailboxDiscoveryService.findSentMailbox(client, userEmail);
      const draftMailboxPath = await mailboxDiscoveryService.findDraftMailbox(client, userEmail);

      const spamResult = await spamHandlingService.processAllSpamFolders(
        client,
        providerConfig.spam,
        providerConfig.mailboxes[0],
        fromEmail
      );
      reportService.updateReportWithSpamStats(report, spamResult.totalSpamFound, spamResult.totalSpamMoved);

      for (const mailboxPath of providerConfig.mailboxes) {
        const lock = await imapClientService.getMailboxLock(client, mailboxPath);
        if (!lock) {
          logger.warn(`[AccountProcessing] Не удалось заблокировать ящик ${mailboxPath} для ${userEmail}, пропускаем.`);
          reportService.updateReportWithEmailStats(report, 0, 0, `Failed to lock mailbox: ${mailboxPath}`);
          continue;
        }

        try {
          logger.info(`[AccountProcessing] Поиск писем в ${mailboxPath} для ${userEmail} от ${fromEmail}`);
          const messageUids = await searchMessagesService.searchUnseenFromSender(client, fromEmail);

          reportService.updateReportWithEmailStats(report, messageUids.length);

          const uidsToProcess = messageUids.slice(0, limit);
          logger.info(`[AccountProcessing] Найдено ${messageUids.length} писем, будет обработано ${uidsToProcess.length} (лимит: ${limit})`);

          const messagesToMarkAsSeen: number[] = [];

          for (const uid of uidsToProcess) {
            // ИСПРАВЛЕНО ЗДЕСЬ: убрал emailId из запроса fetchOne
            const message = await client.fetchOne(uid.toString(), { source: true, uid: true, envelope: true, headers: true }, { uid: true });
            if (!message) {
              logger.warn(`[AccountProcessing] Не удалось получить сообщение UID ${uid} из ${mailboxPath}`);
              reportService.updateReportWithEmailStats(report, 0, 0, `Failed to fetch message UID ${uid}`);
              continue;
            }
            // logger.info(message.envelope)
            // fs.writeFileSync('message.json', JSON.stringify(await simpleParser(message.source), (key, value) => typeof value === "bigint" ? Number(value) : value,
            //   2));
            const savedEmailInfo = await emailContentService.saveEmailForBrowser(message, tempDirPath);
            if (savedEmailInfo.filePath) {
              browserTasks.push({
                filePath: savedEmailInfo.filePath,
                linkToOpen: savedEmailInfo.extractedLink,
                uid: message.uid, // UID из полученного message
                subject: savedEmailInfo.subject
              });
            } else {
              reportService.updateReportWithEmailStats(report, 0, 0, `Failed to save email UID ${uid} for browser`);
            }

            messagesToMarkAsSeen.push(uid);

            if (remainingReplies > 0) {
              logger.info(`[AccountProcessing] Попытка ответа на письмо UID ${uid} (осталось попыток: ${remainingReplies})`);
              const preparedReply = await replyService.prepareReply(message, userEmail);
              if (preparedReply.mimeBuffer && preparedReply.emailContent) {
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
                    await replyService.appendEmailToMailbox(client, draftMailboxPath, preparedReply.mimeBuffer, ['\\Draft', '\\Seen'], account.provider);
                    logger.info(`[AccountProcessing] Ответ на UID ${uid} сохранен в черновики из-за ошибки SMTP.`);
                  }
                }
              } else {
                logger.warn(`[AccountProcessing] Не удалось подготовить ответ для UID ${uid}.`);
              }
            }
            await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 3000)));
            // задержка перед загрузкой нового письма
          }

          if (messagesToMarkAsSeen.length > 0) {
            logger.info(`[AccountProcessing] Пометка ${messagesToMarkAsSeen.length} писем как прочитанных в ${mailboxPath}`);
            await client.messageFlagsAdd(messagesToMarkAsSeen, ['\\Seen'], { uid: true });
          }

        } catch (mailboxErr) {
          const errMsg = `Ошибка при обработке ящика ${mailboxPath} для ${userEmail}: ${mailboxErr instanceof Error ? mailboxErr.message : mailboxErr}`;
          handleError(mailboxErr, errMsg, 'processAccountFromSender.mailboxLoop');
          reportService.updateReportWithEmailStats(report, 0, 0, errMsg);
        } finally {
          await imapClientService.releaseMailboxLock(lock, mailboxPath);
        }
      }

    } catch (generalErr) {
      const errMsg = `Общая ошибка при обработке аккаунта ${userEmail}: ${generalErr instanceof Error ? generalErr.message : generalErr}`;
      handleError(generalErr, errMsg, 'processAccountFromSender');
      reportService.updateReportWithEmailStats(report, 0, 0, errMsg);
    } finally {
      reportService.finalizeReportStatus(report);
      // await reportService.submitReport(report, providerConfig.mailboxes.join(', '));
      await imapClientService.disconnectClient(client, userEmail);
      logger.info(`[AccountProcessing] Завершена IMAP/SMTP обработка для: ${userEmail}, отправитель: ${fromEmail}, process_id: ${process_id}`);
    }

    return browserTasks; // Возвращаем задачи для браузера
  }
}

export const accountProcessingService = new AccountProcessingService();
