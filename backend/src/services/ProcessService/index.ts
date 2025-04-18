import path from 'path';
import fs from 'fs';
import puppeteer, { Browser } from 'puppeteer';
import { FetchMessageObject, ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import sanitizeHtml from 'sanitize-html';
import { sanitizeOptions } from './constants';
import { createImapConfig } from '../../utils/createConfig';

export async function processMailbox({
  user,
  from,
  host,
  mailboxes,
  outputPath,
  limit,
  password,
  token
}: {
  user: string;
  from: string;
  host: string;
  mailboxes: string[];
  outputPath: string;
  limit: number;
  password?: string;
  token?: string;
}) {
  const config = createImapConfig({ user, host, password, token });
  const client = new ImapFlow(config);

  const dirPath = path.join(__dirname, '..', '..', outputPath);
  createDir(dirPath);

  let browser;
  try {
    await client.connect();
    browser = await launchBrowser();
    for (const inbox of mailboxes) {
      const lock = await client.getMailboxLock(inbox);

      let list = await searchUnseenFrom({ from, client, inbox });
      console.log(!list.length, limit, inbox, mailboxes);
      if (!list.length) {
        lock.release();
        return;
      }
      list = list.slice(0, limit);
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
          console.log(true, 'message');
          try {
            await processEmail(message, browser, dirPath);
            markAsSeen.push(message.uid);
            if (global.gc) global.gc();
          } catch (err) {
            if (err instanceof Error) {
              console.log(`Ошибка обработки письма ${message.uid}: ${err.message}`);
            } else {
              console.log(`Неизвестная ошибка:`, err);
            }
          }
        }
        await new Promise((r) => setTimeout(r, 1000));
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
    }
  } catch (err) {
    console.error('Error during initial client.connect():', err, user); // More specific catch
    // Handle connection error appropriately
    return;
  } finally {
    if (browser) await browser.close();
    await client.logout();
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
  console.log('Browser launched successfully.');
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
