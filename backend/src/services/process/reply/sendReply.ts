import { FetchMessageObject } from 'imapflow';
import { logger } from '../../../utils/logger';
import { handleError } from '../../../utils/error-handler';
import {  createReplyBuffer, sendReplyEmail } from './createReply';
import { ProcessReport } from '../../../types/reports';

interface SendEmailParams { uid: number; user: string; remainingReplies: number; message: FetchMessageObject; smtpHost: string; password: string | undefined; token: string | undefined; report: ProcessReport; }

export async function ManageReply({ uid, user, remainingReplies, message, smtpHost, password, token, report, }: SendEmailParams) {
    let replySentSuccessfully = false;
    let ReplyBuffer: Buffer | null = null;
    try {
        logger.info(`Attempting to send reply for UID ${uid} ${user}`);
        const { mimeMessageBuffer, emailContent } = await createReplyBuffer(message, user)
        ReplyBuffer = mimeMessageBuffer
        if (emailContent) {
            sendReplyEmail(emailContent, user, smtpHost, { password, token });
            replySentSuccessfully = true;
            logger.info(`Reply sent via SMTP for UID ${uid}.`);
            report.replies_sent += 1
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        else {
            logger.warn(`Failed to send reply for UID ${uid} (createReply returned null).`);
        }
    } catch (replyErr) {
        logger.error(`Error during createReply call for UID ${uid}`, replyErr);
        handleError(replyErr, `Error calling createReply for UID ${uid}`, 'createReply');
    }
    return { replySentSuccessfully, ReplyBuffer }

}