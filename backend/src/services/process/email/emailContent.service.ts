import fs from 'fs';
import path from 'path';
import { FetchMessageObject } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';
import sanitizeHtml from 'sanitize-html';
import * as cheerio from 'cheerio';
import { sanitizeOptions } from '../../constants'; // Убедись, что путь корректен
import { logger } from '../../../utils/logger';
import { handleError } from '../../../utils/error-handler';
import { fileSystemService } from '../utils/fileSystem.service';

export interface SavedEmailInfo {
  filePath: string | null;
  extractedLink: string | null;
  subject?: string | null;
}

export class EmailContentService {
  public async parseEmail(messageSource: Buffer): Promise<ParsedMail | null> {
    try {
      const parsed = await simpleParser(messageSource);
      return parsed;
    } catch (err) {
      handleError(err, '[EmailContent Service] Ошибка парсинга письма', 'parseEmail');
      return null;
    }
  }

  public sanitizeHtmlContent(html: string): string {
    return sanitizeHtml(html, sanitizeOptions);
  }

  public extractFirstLink(html: string): string | null {
    try {
      const doc = cheerio.load(html);
      const link = doc('a:first').attr('href');
      return link || null;
    } catch (err) {
      handleError(err, '[EmailContent Service] Ошибка извлечения ссылки из HTML', 'extractFirstLink');
      return null;
    }
  }
  /**
    * Извлекает первую "валидную" внешнюю HTTP/HTTPS ссылку из HTML.
    * Пропускает якоря, javascript-ссылки и относительные пути.
    * @param html HTML-строка для анализа.
    * @returns Строка с URL или null, если валидная ссылка не найдена.
    */
  public extractFirstValidExternalLink(html: string): string | null {
    try {
      const doc = cheerio.load(html);
      let validLink: string | null = null;

      // Итерируем по всем ссылкам в документе
      doc('a').each((_index, element) => {
        const href = doc(element).attr('href');

        if (href) {
          const trimmedHref = href.trim();
          // 1. Проверяем, что это HTTP или HTTPS ссылка
          if (trimmedHref.startsWith('http://') || trimmedHref.startsWith('https://')) {

            try {
              validLink = trimmedHref;
              return false; // false для .each означает "остановить итерацию", так как мы нашли первую валидную
            } catch (urlParseError) {
              // Если URL невалиден (например, "http://"), пропускаем
              logger.debug(`[EmailContent Service] Невалидный URL при парсинге: ${trimmedHref}`, urlParseError);
              return true; // продолжить итерацию
            }
          }
          // Пропускаем якоря, javascript и mailto (если mailto не нужны)
          // else if (trimmedHref.startsWith('#') || trimmedHref.toLowerCase().startsWith('javascript:') || trimmedHref.toLowerCase().startsWith('mailto:')) {
          //   // Это невалидная для нас ссылка, продолжаем поиск
          //   return true;
          // }
        }
        return true; // Продолжить итерацию, если href пустой или не подошел
      });

      if (validLink) {
        logger.info(`[EmailContent Service] Найдена валидная внешняя ссылка: ${validLink}`);
      } else {
        logger.info('[EmailContent Service] Валидная внешняя ссылка не найдена в HTML.');
      }
      return validLink;

    } catch (err) {
      handleError(err, '[EmailContent Service] Ошибка извлечения валидной внешней ссылки из HTML', 'extractFirstValidExternalLink');
      return null;
    }
  }
  /**
   * Сохраняет HTML-содержимое письма в файл и извлекает первую ссылку.
   * @param message Объект сообщения из ImapFlow
   * @param dirPath Путь к директории для сохранения файлов
   * @returns Объект с путем к файлу и извлеченной ссылкой, или null в случае ошибки.
   */
  public async saveEmailForBrowser(
    message: FetchMessageObject,
    dirPath: string
  ): Promise<SavedEmailInfo> { // SavedEmailInfo определен в предыдущих ответах
    const defaultResult: SavedEmailInfo = { filePath: null, extractedLink: null, subject: null };

    if (!message.source) {
      logger.warn('[EmailContent Service] Отсутствует тело письма (message.source) для сохранения.');
      return defaultResult;
    }

    const parsedEmail = await this.parseEmail(message.source);
    if (!parsedEmail) {
      return defaultResult;
    }

    defaultResult.subject = parsedEmail.subject;

    if (!parsedEmail.html) {
      logger.info(`[EmailContent Service] Письмо (UID: ${message.uid}, Subject: "${parsedEmail.subject}") не содержит HTML-версии.`);
      return defaultResult;
    }

    const sanitizedHtml = this.sanitizeHtmlContent(parsedEmail.html);
    // Используем новый метод для извлечения ссылки
    const extractedLink = this.extractFirstValidExternalLink(sanitizedHtml);

    if (!fileSystemService.createDirectoryIfNotExists(dirPath)) {
      logger.error(`[EmailContent Service] Не удалось создать/получить доступ к директории ${dirPath} для сохранения письма.`);
      return defaultResult;
    }

    const fileName = `email_uid${message.uid}_${message.emailId || 'noEmailId'}_${Date.now()}.html`;
    const filePath = path.join(dirPath, fileName);

    try {
      await fs.promises.writeFile(filePath, sanitizedHtml);
      logger.info(`[EmailContent Service] HTML письма (UID: ${message.uid}) сохранен в: ${filePath}`);
      return { filePath, extractedLink, subject: parsedEmail.subject };
    } catch (err) {
      handleError(err, `[EmailContent Service] Ошибка записи HTML письма (UID: ${message.uid}) в файл ${filePath}`, 'saveEmailForBrowser');
      return { ...defaultResult, subject: parsedEmail.subject };
    }
  }
}

export const emailContentService = new EmailContentService();
