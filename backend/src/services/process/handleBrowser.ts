import fs from 'fs';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { ProcessReport } from '../../types/reports';
import { handleError } from '../../utils/error-handler';
import { logger } from '../../utils/logger';
import { Page } from 'puppeteer';

puppeteer.use(StealthPlugin());

export async function handleBrowser({
    ProcessObject,
    openRate,
    report, }: {
        ProcessObject: {
            file: string;
            link: string;
            uid: number; seq: number
        }[],
        openRate: number,
        report: ProcessReport,
    }) {
    let shouldOpenCount = Math.ceil((ProcessObject.length * openRate) / 100);
    const browser = await puppeteer.launch({ headless: false });
    logger.debug(ProcessObject)
    try {
        for (const mail of ProcessObject) {
            const delay = Math.floor(Math.random() * 2000);
            const page = await browser.newPage();
            await openMail(page, mail, report,)



            if (shouldOpenCount > 0) {
                const page = await browser.newPage();
                await openLink(report, page, mail)
                shouldOpenCount -= 1;
            }

            await new Promise((r) => setTimeout(r, delay));

        }
    } catch (err) {
        handleError(err, '', 'handleBrowser');

    }
    finally {
        if (browser) await browser.close();
    }
}


const openMail = async (page: Page, mail: {
    file: string;
    link: string;
    uid: number; seq: number
}, report: ProcessReport,) => {
    try {
        await page.goto(mail.file, {
            waitUntil: 'networkidle2',
            timeout: 20000
        });

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 3000)));
        report.emails.processed += 1;
        logger.info('mail opened', mail.file)
    } catch (err) {
        handleError(err, 'error during mail opening', 'openMail')
    }
    finally {
        if (page) {
            await page.close()
        }
        logger.info('открыто письмо')
        fs.unlinkSync(mail.file)
    }
}
const openLink = async (report: ProcessReport, page: Page, mail: {
    file: string;
    link: string;
    uid: number;
}) => {
    try {
        report.links.attemptedOpen += 1;
        await page.goto(mail.link, {
            waitUntil: 'networkidle2',
            timeout: 5000
        });
        report.links.targetOpen += 1;
        logger.info('перешли по ссылке')

        await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 2000)));
    } catch (err) {
        report.links.errors += 1;
        handleError(err, 'error during link opening', 'openLink')
    } finally {
        await page.close()
    }
}
