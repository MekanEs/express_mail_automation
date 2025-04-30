import path from 'path';
import { ImapFlow } from 'imapflow';
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
import { report } from 'process';

type processMailBoxArgs = {
    user: string;
    from: string;
    host: string;
    mailboxes: string[];
    spam: string[];
    outputPath: string;
    limit: number;
    process_id: string;
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
    process_id,
    openRate,
    password,
    token, repliesCount
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

    try {
        const connectionStatus = await connectClient(client)
        if (!connectionStatus) {
            logger.debug('no connection')
            return
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
        const replies: {
            path: string;
            mimeMessage: Buffer;
            flags: string[];
        }[] = []
        for (const inbox of mailboxes) {
            const markAsSeen: number[] = [];
            let lock;
            try {
                logger.info('try to get inbox', inbox)
                lock = await client.getMailboxLock(inbox);
            } catch (err) {
                console.log(await client.list())
                handleError(err)
                continue;
            }
            let list: number[] | undefined
            try {
                list = await searchMessages({ from, client, inbox });
                logger.info('found messages')
                if (!list.length) {
                    lock.release();
                    continue;
                }
                report.emails.found = list.length;
                list = list.slice(0, limit);
            } catch (err) {
                handleError(err, 'error during message search', 'searchMessages')
                list = []
            }



            for (const uid of list) {
                logger.info('сохраняю письмо')
                const message = await client.fetchOne(
                    uid.toString(),
                    { source: true, uid: true, flags: true, labels: true, envelope: true },
                    { uid: true }
                );
                try {
                    if (repliesCount > 0) {
                        const reply = await createReply(client, message, user)
                        if (reply) {
                            replies.push(reply)
                        }
                        repliesCount -= 1
                    }
                } catch (err) {
                    logger.error('error during reply creation', err)
                }
                logger.debug(message)
                try {
                    await SaveProcessedEmail(message, dirPath, ProcessObject);
                    markAsSeen.push(message.uid);
                    if (global.gc) global.gc();
                } catch (err) {
                    report.emails.errors += 1;
                    if (err instanceof Error) {
                        report.emails.errorMessages.push(err.message);
                    } else {
                        logger.info(`Неизвестная ошибка:`, err);
                    }
                }
            }
            await markMessagesAsSeen(client, markAsSeen)
            lock.release();
        }
        await handleBrowser({ openRate, ProcessObject, report })


        for (let reply of replies) {
            try {
                logger.info('appending reply', reply.path, reply.flags)
                const res = await client.append(reply.path, reply.mimeMessage, reply.flags)
                logger.info('reply appended', res)
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 second

            } catch (err) {
                handleError(err, 'error during reply append', 'append')
            }
        }


        if (report.emails.errors === 0 && report.links.errors === 0) {
            report.status = 'success';
        } else {
            report.status = 'partial_failure';
        }

        await sendReport({ from, inbox: mailboxes.join(', '), process_id, report, user });
    } catch (err) {
        logger.error('Error during initial client.connect():', err, user); // More specific catch
        // Handle connection error appropriately
        return;
    } finally {

        await client.logout();

        // Логирование
        logger.info('Отключение завершено.');

    }
}



// async function launchBrowser(headless: boolean = false): Promise<Browser> {
//     logger.info(`Launching browser (headless: ${headless})...`);
//     const browser = await puppeteer.launch({
//         headless: headless,
//         args: ['--no-sandbox', '--disable-setuid-sandbox']
//     });
//     return browser;
// }









