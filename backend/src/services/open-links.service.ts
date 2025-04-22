import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { ProcessReport } from '../types/reports';

puppeteer.use(StealthPlugin());

export const openLinks = async (links: string[], report: ProcessReport) => {
    const browser = await puppeteer.launch({ headless: false });
    try {
        console.log(`got ${links.length} links. Start to open.`);

        for (const link of links) {
            let page = null;
            try {
                report.links.attemptedOpen += 1;
                page = await browser.newPage();
                console.log(`Opening link: ${link}`);

                await page.setUserAgent(
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
                );

                await page.goto(link, {
                    waitUntil: 'networkidle2',
                    timeout: 30000
                });
                console.log(`Link opened successfully: ${link}`);
                report.links.targetOpen += 1;
                const delay = Math.floor(Math.random() * 2000) + 1000;
                await new Promise((r) => setTimeout(r, delay));
                console.log(`Waited ${delay}ms for link: ${link}`);

            } catch (err) {
                report.links.errors += 1;
                report.links.errorMessages.push(`Ошибка открытия : ${err instanceof Error ? err?.message : 'Unknown error'}`);
            } finally {
                if (page) {
                    await page.close();
                    console.log(`Page closed for link: ${link}`);
                }
            }
        }
    } catch (err) {
        console.error('Error in openLinks browser operation:', err);
    } finally {
        if (browser) {
            await browser.close();
            console.log('Browser closed. End of links opening');
        }
    }
};
