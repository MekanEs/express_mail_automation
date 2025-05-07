import path from 'path';
import { ProcessReport } from '../../types/reports';
import { createDir } from './utils/createDir';
import { searchMessages } from './utils/searchUnseen';
import { spamBoxesCheck } from './mailbox/spamBoxCheckAndRemove';
import { getBaseReport } from './utils/getBaseReport';
import { sendReport } from './utils/sendReport';
import { connectClient } from './client/connectClient';
import { SaveProcessedEmail } from './saveProcessedEmail';
import { handleBrowser } from './handleBrowser';
import { logger } from '../../utils/logger';
import { handleError } from '../../utils/error-handler';
import { markMessagesAsSeen } from './utils/markMessagesAsSeen';
import { Database } from '../../clients/database.types';
import { findSentMailbox } from './mailbox/findSentMailbox';
import { ManageReply, } from './reply/sendReply';
import { appendReply } from './reply/appendReply';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser } from 'puppeteer';
import { disconnectClient } from './client/disconnectClient';
import { createImapClient } from './client/createImapClient';
import { findDraftMailbox } from './mailbox/findDraftMailbox';
puppeteer.use(StealthPlugin());

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


    const client = createImapClient(user, host, password, token)


    const dirPath = path.join(__dirname, '..', outputPath);
    createDir(dirPath);


    let remainingReplies = repliesCount;
    let sentMailboxPath: string | null = null;
    let draftMailboxPath: string | null = null;
    const browser: Browser = await puppeteer.launch({ headless: false });
    try {
        const connectionStatus = await connectClient(client)
        if (!connectionStatus) {
            logger.debug('no connection')
            return
        }
        logger.info("подключен", user)


        sentMailboxPath = await findSentMailbox(client, user)
        draftMailboxPath = await findDraftMailbox(client, user)

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
            const ProcessObject: {
                file: string;
                link: string;
                uid: number;
                seq: number
            }[] = [];
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
                list = await searchMessages({ from, client, inbox, });
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
                    logger.info(message)
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
                if (remainingReplies > 0) {
                    console.log('remainingReplies', remainingReplies)
                    const { replySentSuccessfully, ReplyBuffer } = await ManageReply({ uid, user, remainingReplies, message, smtpHost, password, token, report })
                    if (replySentSuccessfully) {
                        remainingReplies -= 1
                    }
                    await appendReply({ replySentSuccessfully, ReplyBuffer, sentMailboxPath, draftMailboxPath, client, provider, uid, })
                }
            }
            if (ProcessObject.length > 0) {
                await handleBrowser({ browser, openRate, ProcessObject, report });
            } else {
                logger.info("No emails processed for link handling.");
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


        if (report.emails.errors === 0 && report.links.errors === 0) {
            report.status = 'success';
        } else {
            report.status = 'partial_failure';
        }

        await sendReport({ from, inbox: mailboxes.join(', '), process_id, report, user });
    } catch (err) {
        handleError(err, `Unhandled error during mailbox processing: ${user}`, 'processMailbox')
    } finally {
        disconnectClient(client)
        if (browser) {
            await browser.close()
        }
    }
}





