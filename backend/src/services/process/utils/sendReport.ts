import { supabaseClient } from "../../../clients/supabaseClient";
import { ProcessReport } from "../../../types/reports";
import { logger } from "../../../utils/logger";

export interface SendReportParams {
  user: string;
  report: ProcessReport;
  from: string;
  process_id: string;
  inbox: string;
}

export type SendReportFunc = (params: SendReportParams) => Promise<void>;

export const sendReport: SendReportFunc = async ({ user, report, from, process_id, inbox }) => {
  logger.info(`Отправка отчета для ${user}`)
  logger.info(report)
  const res = await supabaseClient.from('reports').insert({
    account: user,
    emails_errorMessages: report.emails.errorMessages,
    emails_errors: report.emails.errors,
    emails_found: report.emails.found,
    replies_Sent: report.replies_sent,
    emails_processed: report.emails.processed,
    links_attemptedOpen: report.links.attemptedOpen,
    links_errorMessages: report.links.errorMessages,
    links_errors: report.links.errors,
    links_found: report.links.found,
    links_targetOpen: report.links.targetOpen,
    spam_found: report.spam.found,
    spam_moved: report.spam.moved,
    inbox: inbox,
    process_id: process_id,
    sender: from,
    status: report.status
  });
  logger.info(`Отчет отправлен для ${user}`)
  logger.info(res)
};
