import { FetchMessageObject, ImapFlow } from 'imapflow';
import * as nodemailer from 'nodemailer';
import MailComposer from 'nodemailer/lib/mail-composer';
import { simpleParser, } from 'mailparser';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { AuthenticationType } from 'nodemailer/lib/smtp-connection';
import { logger } from '../../../utils/logger';
import { handleError } from '../../../utils/error-handler';
import { Provider } from '../../../types/types'; // Убедись, что тип Provider доступен
import { warmupReplies } from './warmupReplies';

// Тексты ответов можно вынести в константы или отдельный файл, если их много

export interface SmtpAuthOptions {
  password?: string;
  token?: string;
}

interface EmailContent {
  from: string;
  to: string;
  subject: string;
  inReplyTo?: string; // messageId может отсутствовать
  references?: string; // messageId может отсутствовать
  text: string;
  html: string;
}

interface PreparedReply {
  mimeBuffer: Buffer | null;
  emailContent: EmailContent | null;
}

export class ReplyService {
  /**
   * Готовит буфер MIME сообщения и его контент для ответа.
   */
  public async prepareReply(originalMessage: FetchMessageObject, currentUserEmail: string): Promise<PreparedReply> {
    let toAddress = '';
    try {
      if (!originalMessage.envelope) {
        throw new Error('Original message envelope not found');
      }
      if (!originalMessage.envelope.from || originalMessage.envelope.from.length === 0 || !originalMessage.envelope.from[0].address) {
        throw new Error('Sender address not found in original message envelope');
      }
      toAddress = originalMessage.envelope.from[0].address;

      const replyTextSnippet = warmupReplies[Math.floor(Math.random() * warmupReplies.length)];

      const parsedOriginal = await simpleParser(originalMessage.source || Buffer.from(''));
      const originalHtml = parsedOriginal.html || '<p>Original message not available in HTML format.</p>';
      const originalText = parsedOriginal.text || 'Original message not available in text format.';

      const quotedHtml = `Здравствуйте,<br>${replyTextSnippet}<br><br>--- Original message ---<br>From: ${originalMessage.envelope.from[0].name || ''} <${toAddress}><br>Subject: ${originalMessage.envelope.subject || ''}<br>Date: ${originalMessage.envelope.date || ''}<br><br><blockquote>${originalHtml}</blockquote>`;
      const quotedText = `Здравствуйте,\n${replyTextSnippet}\n\n--- Original message ---\nFrom: ${originalMessage.envelope.from[0].name || ''} <${toAddress}>\nSubject: ${originalMessage.envelope.subject || ''}\nDate: ${originalMessage.envelope.date || ''}\n\n> ${originalText.split('\n').join('\n> ')}`;

      const emailContent: EmailContent = {
        from: currentUserEmail,
        to: toAddress,
        subject: `Re: ${originalMessage.envelope.subject || 'No Subject'}`,
        inReplyTo: originalMessage.envelope.messageId,
        references: originalMessage.envelope.messageId,
        text: quotedText,
        html: quotedHtml,
      };

      const mail = new MailComposer({
        from: emailContent.from,
        to: emailContent.to,
        subject: emailContent.subject,
        inReplyTo: emailContent.inReplyTo,
        references: emailContent.references,
        html: emailContent.html,
        text: emailContent.text,
        date: new Date().toUTCString(),
      });

      const mimeBuffer = await new Promise<Buffer>((resolve, reject) => {
        mail.compile().build((err, builtMessage) => {
          if (err) {
            reject(err)
          } else {
            resolve(builtMessage);
          }
        });
      });

      return { mimeBuffer, emailContent };

    } catch (err) {
      handleError(err, `[Reply Service] Ошибка при подготовке ответа для ${toAddress || 'unknown sender'}`, 'prepareReply');
      return { mimeBuffer: null, emailContent: null };
    }
  }

  /**
   * Отправляет подготовленное письмо через SMTP.
   */
  public async sendSmtpEmail(
    emailContent: EmailContent,
    smtpHost: string,
    authOptions: SmtpAuthOptions
  ): Promise<boolean> {
    try {
      let smtpAuth: AuthenticationType;
      if (authOptions.token) {
        smtpAuth = { type: 'OAUTH2', user: emailContent.from, accessToken: authOptions.token };
      } else if (authOptions.password) {
        smtpAuth = { type: 'LOGIN', user: emailContent.from, pass: authOptions.password };
      } else {
        throw new Error('No password or token provided for SMTP authentication');
      }

      const transportConfig: SMTPTransport.Options = {
        host: smtpHost,
        port: 587, // Default STARTTLS
        secure: false,
        auth: smtpAuth,
        connectionTimeout: 10000, // 10s
        greetingTimeout: 10000,
        socketTimeout: 15000,
        tls: { rejectUnauthorized: false }, // Для самоподписанных сертификатов, если нужно
        // logger: true, // Включить для детального логгирования SMTP команд
        // debug: true,
      };

      let transporter = nodemailer.createTransport(transportConfig);

      try {
        await transporter.verify();
        logger.info(`[Reply Service] SMTP (STARTTLS, ${smtpHost}:${transportConfig.port}) соединение для ${emailContent.from} успешно проверено.`);
      } catch (verifyErr) {
        logger.warn(`[Reply Service] SMTP (STARTTLS, ${smtpHost}:${transportConfig.port}) проверка не удалась для ${emailContent.from}: ${verifyErr instanceof Error ? verifyErr.message : verifyErr}. Пробуем SSL...`);
        transportConfig.port = 465; // SSL
        transportConfig.secure = true;
        transporter = nodemailer.createTransport(transportConfig);
        try {
          await transporter.verify();
          logger.info(`[Reply Service] SMTP (SSL, ${smtpHost}:${transportConfig.port}) соединение для ${emailContent.from} успешно проверено.`);
        } catch (sslErr) {
          logger.warn(`[Reply Service] SMTP (SSL, ${smtpHost}:${transportConfig.port}) проверка не удалась для ${emailContent.from}: ${sslErr instanceof Error ? sslErr.message : sslErr}. Пробуем порт 25 (без шифрования)...`);
          transportConfig.port = 25; // Basic, no encryption
          transportConfig.secure = false;
          // transportConfig.requireTLS = false; // Явно указать, что TLS не обязателен
          // delete transportConfig.tls; // Удалить конфигурацию TLS
          transporter = nodemailer.createTransport(transportConfig);
          // Для порта 25 verify может не работать или быть нежелательным, сразу пробуем отправить
        }
      }

      const info = await transporter.sendMail({
        from: emailContent.from,
        to: emailContent.to,
        subject: emailContent.subject,
        inReplyTo: emailContent.inReplyTo,
        references: emailContent.references,
        html: emailContent.html,
        text: emailContent.text,
        envelope: { from: emailContent.from, to: [emailContent.to] }
      });

      logger.info(`[Reply Service] Ответ успешно отправлен через SMTP на ${emailContent.to} от ${emailContent.from}. Message ID: ${info.messageId}`);
      return true;
    } catch (err) {
      handleError(err, `[Reply Service] Ошибка при отправке SMTP письма на ${emailContent.to} от ${emailContent.from}`, 'sendSmtpEmail');
      return false;
    }
  }

  /**
   * Сохраняет буфер письма в указанный IMAP ящик.
   */
  public async appendEmailToMailbox(
    client: ImapFlow,
    mailboxPath: string,
    emailBuffer: Buffer,
    flags: string[] = ['\\Seen'],
    provider: Provider // Provider может влиять на логику, например, для Google не сохранять
  ): Promise<boolean> {
    if (provider === 'google') {
      logger.info(`[Reply Service] Для Google провайдера ответ автоматически сохраняется, пропуск appendEmailToMailbox.`);
      return true; // Считаем успешным, так как Gmail делает это сам
    }

    if (!mailboxPath) {
      logger.warn(`[Reply Service] Не указан путь к ящику для сохранения письма (appendEmailToMailbox).`);
      return false;
    }

    try {
      logger.info(`[Reply Service] Попытка добавления письма в ящик ${mailboxPath} с флагами ${flags.join(', ')}.`);
      const appendResult = await client.append(mailboxPath, emailBuffer, flags);
      logger.info(`[Reply Service] Письмо успешно добавлено в ${mailboxPath}. Результат:`, appendResult.uid); // appendResult может содержать UID
      return true;
    } catch (appendErr) {
      handleError(appendErr, `[Reply Service] Не удалось добавить письмо в ящик ${mailboxPath}`, 'appendEmailToMailbox');
      return false;
    }
  }
}

export const replyService = new ReplyService();
