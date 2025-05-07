import path from 'path';
import fs from 'fs';
import { FetchMessageObject } from 'imapflow';
import { simpleParser } from 'mailparser';
import { sanitizeOptions } from '../constants';
import * as cheerio from 'cheerio';
import sanitizeHtml from 'sanitize-html';
import { logger } from '../../utils/logger';

export async function SaveProcessedEmail(
    message: FetchMessageObject,
    dirPath: string,
    ProcessObject: {
        file: string;
        link?: string;
        uid: number
    }[]
) {
    const htmlPath = path.join(dirPath, `email_${message.emailId ?? "_"}${message.uid}.html`);

    const parsed = await simpleParser(message.source);
    logger.info('начало', parsed.subject);
    if (!parsed.html) {
        return;
    }

    const sanitizedHtml = sanitizeHtml(parsed.html, sanitizeOptions);
    fs.writeFileSync(htmlPath, sanitizedHtml);
    const doc = cheerio.load(sanitizedHtml);
    const link = doc('a:first').attr('href');
    ProcessObject.push({ file: htmlPath, link, uid: message.uid });

    await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 3000)));
}
