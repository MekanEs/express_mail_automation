import path from 'path';
import fs from 'fs';
import puppeteer, { Browser } from 'puppeteer';
import { FetchMessageObject, ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import sanitizeHtml from 'sanitize-html';
import { sanitizeOptions } from './constants';
import { createImapConfig } from '../utils/createConfig';
import * as cheerio from 'cheerio';
import { openLinks } from './open-links.service';
import { ProcessReport } from '../types/reports';
import { supabaseClient } from '../clients/supabaseClient';

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
    token
}: {
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
}) {
    if (!openRate) {
        openRate = 70;
    }
    console.log({
        user,
        from,
        host,
        mailboxes,
        outputPath,
        limit,
        process_id,
        openRate,
        password,
        token,
        spam
    })
    const config = createImapConfig({ user, host, password, token });
    const client = new ImapFlow(config);

    const dirPath = path.join(__dirname, '..', outputPath);
    createDir(dirPath);

    let browser;
    let linksToOpen: string[] = [];
    try {
        await client.connect();
        browser = await launchBrowser();
        linksToOpen = [];
        const spamLock = await client.getMailboxLock(spam[0]);
        let spamList = await searchUnseenFrom({ from, client, inbox: spam[0] });
        let { uidMap } = await client.messageMove(spamList, mailboxes[0], { uid: true })
        console.log('перемещено из спам: ', spamList.length, uidMap?.size, ' писем')
        spamLock.release();
        for (const inbox of mailboxes) {
            const report: ProcessReport = {
                process_id: process_id,
                status: 'success',
                account: user,
                sender: from,
                spam: { found: spamList.length, moved: uidMap?.size ?? 0 },
                emails: { found: 0, processed: 0, errors: 0, errorMessages: [] },
                links: { found: 0, targetOpen: 0, attemptedOpen: 0, errors: 0, errorMessages: [] },
            };
            spamList = []
            uidMap = new Map()
            const lock = await client.getMailboxLock(inbox);

            let list = await searchUnseenFrom({ from, client, inbox });
            console.log(!list.length, limit, inbox, mailboxes);
            if (!list.length) {
                lock.release();
                await supabaseClient.from('reports').insert({
                    account: user,
                    emails_errorMessages: report.emails.errorMessages,
                    emails_errors: report.emails.errors,
                    emails_found: report.emails.found,
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
                continue;
            }
            report.emails.found = list.length;
            list = list.slice(0, limit);
            const shouldOpenCount = Math.ceil((list.length * openRate) / 100);
            linksToOpen = [];
            const markAsSeen = [];
            for (let i = 0; i < list.length; i += 10) {
                console.log(true, 'батч', from);
                const batch = list.slice(i, i + 10);

                console.log(true, list, batch);
                for (const uid of batch) {
                    const message = await client.fetchOne(
                        uid.toString(),
                        { source: true, uid: true },
                        { uid: true }
                    );
                    try {
                        const link = await processEmail(message, browser, dirPath);
                        if (linksToOpen.length < shouldOpenCount && !!link) {
                            linksToOpen.push(link);
                            report.links.found += 1;
                        }
                        report.emails.processed += 1;
                        markAsSeen.push(message.uid);
                        if (global.gc) global.gc();
                    } catch (err) {
                        report.emails.errors += 1;
                        if (err instanceof Error) {
                            report.emails.errorMessages.push(err.message);
                            console.log(`Ошибка обработки письма ${message.uid}: ${err.message}`);
                        } else {
                            console.log(`Неизвестная ошибка:`, err);
                        }
                    }
                }
            }

            try {
                await client.messageFlagsAdd(markAsSeen, ['\\Seen'], { uid: true });
                console.log(`Письма помечены как прочитанные: ${markAsSeen.join(', ')}`);
            } catch (err) {
                if (err instanceof Error) {
                    console.log(`Ошибка при пометке писем как прочитанных: ${err.message}`);
                } else {
                    console.log(`Неизвестная ошибка:`, err);
                }
            }
            lock.release();
            if (linksToOpen.length) {
                await openLinks(linksToOpen, report);
            }
            if (report.emails.errors === 0 && report.links.errors === 0) {
                report.status = 'success';
            } else {
                report.status = 'partial_failure';
            }
            console.log("Process Report:", JSON.stringify(report, null, 2));
            await supabaseClient.from('reports').insert({
                account: user,
                emails_errorMessages: report.emails.errorMessages,
                emails_errors: report.emails.errors,
                emails_found: report.emails.found,
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
        }
    } catch (err) {
        console.error('Error during initial client.connect():', err, user); // More specific catch
        // Handle connection error appropriately
        return;
    } finally {
        if (browser) await browser.close();
        await client.logout();

        // Логирование
        console.log('Отключение завершено.');
    }
}

async function processEmail(message: FetchMessageObject, browser: Browser, dirPath: string) {
    const page = await browser.newPage();

    const htmlPath = path.join(dirPath, `email_${message.uid}.html`);
    try {
        const parsed = await simpleParser(message.source);
        console.log('start', parsed.subject);
        if (!parsed.html) {
            await page.close();
            return;
        }

        const sanitizedHtml = sanitizeHtml(parsed.html, sanitizeOptions);
        fs.writeFileSync(htmlPath, sanitizedHtml);
        const doc = cheerio.load(sanitizedHtml);
        const link = doc('a:first').attr('href');
        console.log(`found link ${link}`);
        try {
            await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });
        } catch (err) {
            if (err instanceof Error) {
                console.log(`Ошибка при загрузке HTML в браузер: ${err.message}`);
            } else {
                console.log(`Неизвестная ошибка:`, err);
            }
        }
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 3000)));

        console.log(`✔ Обработано письмо: "${parsed.subject || 'без темы'}" ${message.uid}`);
        return link;
    } finally {
        await page.close();
        console.log('page closed');
        if (fs.existsSync(htmlPath)) {
            fs.unlinkSync(htmlPath);
            console.log('file deleted');
        }
    }
}

async function launchBrowser(headless: boolean = false): Promise<Browser> {
    console.log(`Launching browser (headless: ${headless})...`);
    const browser = await puppeteer.launch({
        headless: headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    return browser;
}

const createDir = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) {
        try {
            fs.mkdirSync(dirPath, { recursive: true });
        } catch (err) {
            console.error('Ошибка создания папки:', err);
            return;
        }
    }
};

const searchUnseenFrom: ({
    from,
    client,
    inbox
}: {
    from: string;
    client: ImapFlow;
    inbox: string;
}) => Promise<number[]> = async ({ from, client, inbox }) => {
    const list1 = await client.search({ from }, { uid: true });
    const list2 = await client.search({ seen: false }, { uid: true });
    const list = list1.filter((el) => list2.includes(el));
    console.log(`[${inbox}] Найдено писем: ${list.length}`);
    return list;
};
