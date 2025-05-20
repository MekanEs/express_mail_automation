import { supabaseClient } from '../../../clients/supabaseClient';
import { ProcessReport } from '../../../types/reports';
import { InsertReportType } from '../../../types/types'; // Убедись, что этот тип экспортируется
import { logger } from '../../../utils/logger';
import { handleError } from '../../../utils/error-handler';
import { injectable } from "inversify";
import "reflect-metadata";

export interface IReportService {
  initializeReport(
    process_id: string,
    accountEmail: string,
    senderEmail: string,
    initialSpamFound?: number,
    initialSpamMoved?: number
  ): ProcessReport;
  updateReportWithSpamStats(report: ProcessReport, spamFound: number, spamMoved: number): void;
  updateReportWithEmailStats(report: ProcessReport, emailsFoundDelta?: number, emailsProcessedDelta?: number, emailError?: string): void;
  updateReportWithLinkStats(report: ProcessReport, attemptedOpenDelta?: number, targetOpenDelta?: number, linkError?: string): void;
  updateReportWithReplyStats(report: ProcessReport, replySent: boolean): void;
  finalizeReportStatus(report: ProcessReport): void;
  submitReport(report: ProcessReport, inboxPaths: string): Promise<void>;
}

@injectable()
export class ReportService implements IReportService {
  public initializeReport(
    process_id: string,
    accountEmail: string,
    senderEmail: string,
    initialSpamFound: number = 0,
    initialSpamMoved: number = 0
  ): ProcessReport {
    logger.info(`[Report Service] Инициализация отчета для process_id: ${process_id}, account: ${accountEmail}, sender: ${senderEmail}`);
    return {
      process_id: process_id,
      status: 'partial_failure', // Начальный статус, изменится на success, если все ок
      account: accountEmail,
      sender: senderEmail,
      replies_sent: 0,
      spam: { found: initialSpamFound, moved: initialSpamMoved },
      emails: { found: 0, processed: 0, errors: 0, errorMessages: [] },
      links: { found: 0, targetOpen: 0, attemptedOpen: 0, errors: 0, errorMessages: [] }
    };
  }

  public updateReportWithSpamStats(report: ProcessReport, spamFound: number, spamMoved: number): void {
    report.spam.found += spamFound;
    report.spam.moved += spamMoved;
  }

  public updateReportWithEmailStats(report: ProcessReport, emailsFoundDelta: number = 0, emailsProcessedDelta: number = 0, emailError?: string): void {
    report.emails.found += emailsFoundDelta;
    report.emails.processed += emailsProcessedDelta;
    if (emailError) {
      report.emails.errors += 1;
      report.emails.errorMessages.push(emailError);
    }
  }

  public updateReportWithLinkStats(report: ProcessReport, attemptedOpenDelta: number = 0, targetOpenDelta: number = 0, linkError?: string): void {
    report.links.attemptedOpen += attemptedOpenDelta;
    report.links.targetOpen += targetOpenDelta;
    if (linkError) {
      report.links.errors += 1;
      report.links.errorMessages.push(linkError);
    }
  }

  public updateReportWithReplyStats(report: ProcessReport, replySent: boolean): void {
    if (replySent) {
      report.replies_sent += 1;
    }
  }

  public finalizeReportStatus(report: ProcessReport): void {
    if (report.emails.errors === 0 && report.links.errors === 0) {
      // Можно добавить более сложную логику, например, если не найдено писем, считать это не 'success'
      if (report.emails.found > 0 && report.emails.processed === report.emails.found) {
        report.status = 'success';
      } else if (report.emails.found === 0 && report.spam.found > 0 && report.spam.moved === report.spam.found) {
        // Если только спам был найден и перемещен, тоже можно считать успехом
        report.status = 'success';
      } else if (report.emails.found === 0 && report.spam.found === 0) {
        // Если ничего не найдено, это не ошибка, но и не полный успех в контексте обработки
        report.status = 'success'; // или другой статус, например, 'no_action'
      }
      // Иначе остается 'partial_failure' или можно ввести 'failure', если много ошибок
    }
    logger.info(`[Report Service] Финализирован статус отчета для process_id ${report.process_id}: ${report.status}`);
  }

  public async submitReport(report: ProcessReport, inboxPaths: string): Promise<void> {
    logger.info(`[Report Service] Отправка отчета для process_id: ${report.process_id}, account: ${report.account}`);

    const reportDataToInsert: InsertReportType = {
      process_id: report.process_id,
      status: report.status,
      account: report.account,
      sender: report.sender,
      replies_Sent: report.replies_sent,
      spam_found: report.spam.found,
      spam_moved: report.spam.moved,
      emails_found: report.emails.found,
      emails_processed: report.emails.processed,
      emails_errors: report.emails.errors,
      emails_errorMessages: report.emails.errorMessages.length > 0 ? report.emails.errorMessages : null,
      links_found: report.links.found, // Предполагается, что links.found это кол-во писем, где найдена ссылка
      links_targetOpen: report.links.targetOpen,
      links_attemptedOpen: report.links.attemptedOpen,
      links_errors: report.links.errors,
      links_errorMessages: report.links.errorMessages.length > 0 ? report.links.errorMessages : null,
      inbox: inboxPaths,
      // created_at будет установлен базой данных
    };

    try {
      const { error } = await supabaseClient.from('reports').insert(reportDataToInsert);
      if (error) {
        handleError(error, `[Report Service] Ошибка Supabase при отправке отчета для process_id: ${report.process_id}`, 'submitReport.insert');
        // Возможно, стоит пробросить ошибку, если отправка отчета критична
      } else {
        logger.info(`[Report Service] Отчет для process_id ${report.process_id} успешно отправлен.`);
      }
    } catch (err) {
      handleError(err, `[Report Service] Непредвиденная ошибка при отправке отчета для process_id: ${report.process_id}`, 'submitReport');
    }
  }
}

