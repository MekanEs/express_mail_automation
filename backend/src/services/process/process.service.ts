import path from 'path';
import { FetchMessageObject, ImapFlow } from 'imapflow';
import { createImapConfig } from '../../utils/createConfig';
import { ProcessReport } from '../../types/reports';
import { createDir } from './utils/createDir';
import { searchMessages } from './utils/searchUnseen';
import { spamBoxesCheck } from './spamBoxCheckAndRemove';
import { getBaseReport } from './utils/getBaseReport';
import { sendReport } from './utils/sendReport';
import { connectClient } from './connectClient';
import { SaveProcessedEmail } from './saveProcessedEmail';
import { handleBrowser } from './handleBrowser';
import { logger } from '../../utils/logger';
import { handleError } from '../../utils/error-handler';
import { markMessagesAsSeen } from './utils/markMessagesAsSeen';
import { createReply } from './createReply';
import { Database } from '../../clients/database.types';
import { Provider } from '../../types/types';

type processMailBoxArgs = {
    user: string;
    from: string;
    host: string;
    mailboxes: string[];
    spam: string[];
    outputPath: string;
    limit: number;
    process_id: string;
    smtpHost: string;
    provider: Database["public"]["Enums"]["Provider"],
    openRate?: number;
    password?: string;
    token?: string;
    repliesCount: number;
};
export async function processMailbox({
    user,
    from,
    host,
    mailboxes,
    spam,
    outputPath,
    limit,
    provider,
    smtpHost,
    process_id,
    openRate,
    password,
    token,
    repliesCount
}: processMailBoxArgs) {
    if (!openRate) {
        openRate = 70;
    }

    const config = createImapConfig({ user, host, password, token });
    logger.info(config)
    const client = new ImapFlow(config);
    logger.info("подключен", user)
    const dirPath = path.join(__dirname, '..', outputPath);
    createDir(dirPath);
    const ProcessObject: {
        file: string;
        link: string;
        uid: number;
        seq: number
    }[] = [];

    const remainingReplies = repliesCount;
    let sentMailboxPath: string | null = null;

    try {
        const connectionStatus = await connectClient(client)
        if (!connectionStatus) {
            logger.debug('no connection')
            return
        }

        try {
            const allMailboxes = await client.list();
            const foundSentBox = allMailboxes.find(box =>
                box.specialUse === '\\Sent' ||
                box.path.toLowerCase() === 'sent' ||
                box.path.toLowerCase() === 'sent items' ||
                box.path.toLowerCase() === 'отправленные'
            );
            if (foundSentBox) {
                sentMailboxPath = foundSentBox.path;
                logger.info(`Found 'Sent' mailbox: ${sentMailboxPath}`);
            } else {
                logger.warn(`Could not automatically detect 'Sent' mailbox for user ${user}. Replies will not be saved to Sent.`);
            }
        } catch (listErr) {
            handleError(listErr, `Failed to list mailboxes to find Sent folder for ${user}`, 'client.list');
        }

        const { spamListResult, uidMaps } = await spamBoxesCheck({
            client,
            spamBoxes: spam,
            inboxPath: mailboxes[0],
            from
        });

        const report: ProcessReport = getBaseReport({
            from,
            found: spamListResult.length,
            user,
            process_id,
            moved: uidMaps?.size ?? 0
        });

        for (const inbox of mailboxes) {
            const markAsSeen: number[] = [];
            let lock;
            try {
                logger.info('try to get inbox', inbox)
                lock = await client.getMailboxLock(inbox);
            } catch (err) {
                logger.error(`Failed to lock mailbox ${inbox}`, err);
                handleError(err)
                continue;
            }
            let list: number[] | undefined
            try {
                list = await searchMessages({ from, client, inbox });
                logger.info(`found ${list.length} messages in ${inbox}`)
                if (!list.length) {
                    lock.release();
                    continue;
                }
                report.emails.found += list.length;
                list = list.slice(0, limit);
            } catch (err) {
                handleError(err, 'error during message search', 'searchMessages')
                list = []
                lock.release();
                continue;
            }
            const messages = []
            for (const uid of list) {
                let message;
                try {
                    message = await client.fetchOne(
                        uid.toString(),
                        { source: true, uid: true, flags: true, labels: true, envelope: true },
                        { uid: true }
                    );
                    messages.push(message)
                } catch (fetchErr) {
                    handleError(fetchErr, `Failed to fetch message UID ${uid} from ${inbox}`, 'fetchOne');
                    report.emails.errors += 1;
                    report.emails.errorMessages.push(`Fetch Error UID ${uid}: ${(fetchErr as Error).message}`);
                    continue;
                }

                try {
                    logger.info(`Saving original email UID ${uid}`);
                    await SaveProcessedEmail(message, dirPath, ProcessObject);
                    markAsSeen.push(message.uid);
                    if (global.gc) global.gc();
                } catch (err) {
                    logger.error(`Failed to save email UID ${uid}`, err);
                    report.emails.errors += 1;
                    if (err instanceof Error) {
                        report.emails.errorMessages.push(`Save Error UID ${uid}: ${err.message}`);
                    } else {
                        report.emails.errorMessages.push(`Save Error UID ${uid}: Unknown error`);
                        logger.info(`Неизвестная ошибка при сохранении ${uid}:`, err);
                    }
                }

            }
            for (const message of messages) {
                const { uid } = message
                console.log('remainingReplies', remainingReplies)
                if (remainingReplies > 0) {

                    const { replySentSuccessfully, sentReplyBuffer } = await sendEmail({ uid, user, remainingReplies, message, smtpHost, password, token, report })

                    await appendReply({ replySentSuccessfully, sentReplyBuffer, sentMailboxPath, client, provider, uid })
                }
            }

            try {
                if (markAsSeen.length > 0) {
                    logger.info(`Marking ${markAsSeen.length} messages as seen in ${inbox}`);
                    await markMessagesAsSeen(client, markAsSeen);
                }
            } catch (markErr) {
                handleError(markErr, `Failed to mark messages as seen in ${inbox}`, 'markMessagesAsSeen');
            } finally {
                if (lock) {
                    await lock.release();
                    logger.info(`Released lock for mailbox ${inbox}`);
                }
            }
        }

        if (ProcessObject.length > 0) {
            await handleBrowser({ openRate, ProcessObject, report });
        } else {
            logger.info("No emails processed for link handling.");
        }

        if (report.emails.errors === 0 && report.links.errors === 0) {
            report.status = 'success';
        } else {
            report.status = 'partial_failure';
        }

        await sendReport({ from, inbox: mailboxes.join(', '), process_id, report, user });
    } catch (err) {
        logger.error('Unhandled error during mailbox processing:', err, user);
        handleError(err, 'processMailbox top level error')
    } finally {
        try {
            if (client.usable) {
                await client.logout();
                logger.info('IMAP client logout completed.');
            } else {
                logger.info('IMAP client already logged out or unusable.');
            }
        } catch (logoutErr) {
            logger.error('Error during IMAP client logout:', logoutErr);
        }
    }
}


const sendEmail = async ({ uid, user, remainingReplies, message, smtpHost, password, token, report, }: { uid: number; user: string; remainingReplies: number; message: FetchMessageObject; smtpHost: string; password: string | undefined; token: string | undefined; report: ProcessReport; }) => {
    let replySentSuccessfully = false;
    let sentReplyBuffer: Buffer | null = null;
    try {
        logger.info(`Attempting to send reply for UID ${uid} ${user}`);
        sentReplyBuffer = await createReply(message, user, smtpHost, { password, token });
        report.replies_sent += 1
        if (sentReplyBuffer) {
            replySentSuccessfully = true;
            remainingReplies -= 1;
            logger.info(`Reply sent via SMTP for UID ${uid}. Remaining replies: ${remainingReplies}`);
            await new Promise(resolve => setTimeout(resolve, 500));
        } else {
            logger.warn(`Failed to send reply for UID ${uid} (createReply returned null).`);
        }
    } catch (replyErr) {
        logger.error(`Error during createReply call for UID ${uid}`, replyErr);
        handleError(replyErr, `Error calling createReply for UID ${uid}`, 'createReply');
    }
    return { replySentSuccessfully, sentReplyBuffer }

}

const appendReply = async ({ replySentSuccessfully, sentReplyBuffer, sentMailboxPath, client, provider, uid }: { replySentSuccessfully: boolean; sentReplyBuffer: Buffer<ArrayBufferLike> | null; sentMailboxPath: string | null; client: ImapFlow; provider: Provider; uid: number }) => {
    if (provider !== 'google') {
        if (replySentSuccessfully && sentReplyBuffer && sentMailboxPath) {
            try {
                logger.info(`Appending sent reply for UID ${uid} to ${sentMailboxPath}`);
                const appendResult = await client.append(sentMailboxPath, sentReplyBuffer, ['\\Seen']);
                logger.info(`Successfully appended reply to ${sentMailboxPath}`, appendResult);
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (appendErr) {
                logger.error(`Failed to append sent reply for UID ${uid} to ${sentMailboxPath}`, appendErr);
                handleError(appendErr, `Failed to append reply to Sent folder for UID ${uid}`, 'client.append');
            }
        }
    }
}
