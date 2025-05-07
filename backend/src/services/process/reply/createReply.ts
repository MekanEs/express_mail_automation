import { FetchMessageObject } from "imapflow";
import * as nodemailer from 'nodemailer';
import MailComposer from "nodemailer/lib/mail-composer";
import { simpleParser } from 'mailparser';
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { AuthenticationType } from "nodemailer/lib/smtp-connection";
import { logger } from "../../../utils/logger";
import { handleError } from "../../../utils/error-handler";

const warmupReplies = [
    'Благодарю за информацию. Обязательно учту в дальнейшей работе.  ',
    'Получил письмо, всё на месте. Если потребуется — уточню.  ',
    'Спасибо, сообщение дошло без проблем. Сохраню для дальнейшего использования.  ',
    'Информация принята, при необходимости свяжусь с вами повторно.  ',
    'Ознакомился с содержанием письма. Благодарю за оперативность.  ',
    'Данные получены, проверю и дам обратную связь при необходимости.  ',
    'Сообщение получено, никаких вопросов на данный момент нет.  ',
    'Письмо пришло, буду использовать как справочный материал.  ',
    'Спасибо за уведомление. Вижу всё в порядке.  ',
    'Отметил полученное письмо, вернусь к нему позже.  ',
    'Информация поступила. Принято к сведению.  ',
    'Письмо получено. Спасибо, всё понятно.  ',
    'Спасибо, получил. Свяжусь, если будут дополнительные вопросы.  ',
    'Подтверждаю получение письма. На текущий момент всё ясно.  ',
    'Информация получена, дальнейшие действия не требуются. Благодарю.  ',
    'Письмо получил, всё принято. Если что — свяжусь дополнительно.  ',
    'Принял к сведению, благодарю за предоставленную информацию.  ',
    'Отметил содержание письма. При необходимости уточню детали.  ',
    'Информация получена, замечаний нет. Спасибо.  ',
    'Письмо дошло. Учту при принятии решений.  ',
    'Принял, всё ясно. Если появятся вопросы - напишу.  ',
    'Сообщение зафиксировано, использую при необходимости.  ',
    'Спасибо, всё получено. Обратная связь не требуется.  ',
    'Вижу письмо, данные приняты. Действую по плану.  ',
    'Получено и сохранено. Свяжусь в случае изменений.  ',
    'Ознакомился, всё корректно.Благодарю.  ',
    'Информация на месте. Если что - буду на связи.  ',
    'Письмо зафиксировано. Пока что всё понятно.  ',
    'Спасибо за сообщение. Вопросов не возникло.  ',
    'Отметил для дальнейшего использования. Спасибо.  ',
];

interface SmtpAuth {
    password?: string;
    token?: string;
}

interface EmailContent {
    from: string;
    to: string;
    subject: string;
    inReplyTo: string;
    references: string;
    text: string;
    html: string;
}

// Step 1: Create the MIME message buffer
export const createReplyBuffer = async (
    message: FetchMessageObject,
    user: string
): Promise<{ mimeMessageBuffer: Buffer | null; emailContent: EmailContent | null }> => {
    let toAddress = '';
    try {
        if (!message?.envelope) throw new Error('Envelope not found');
        if (!message.envelope.from || message.envelope.from.length === 0 || !message.envelope.from[0].address) {
            throw new Error('Sender address not found in envelope');
        }
        toAddress = message.envelope.from[0].address;

        const text = warmupReplies[Math.floor(Math.random() * (warmupReplies.length))];
        const parsed = await simpleParser(message.source);
        const originalHtml = parsed.html || '<p>Original message not available in HTML format.</p>';
        const originalText = parsed.text || 'Original message not available in text format.';

        const quotedHtml = `здравствуйте,<br>${text}<br><br>--- Original message ---<br>From: ${message.envelope.from[0].name || ''} &lt;${toAddress}&gt;<br>Subject: ${message.envelope.subject || ''}<br>Date: ${message.envelope.date || ''}<br><br><blockquote>${originalHtml}</blockquote>`;
        const quotedText = `здравствуйте,\n${text}\n\n--- Original message ---\nFrom: ${message.envelope.from[0].name || ''} <${toAddress}>\nSubject: ${message.envelope.subject || ''}\nDate: ${message.envelope.date || ''}\n\n> ${originalText.split('\n').join('\n> ')}`;

        const emailContent: EmailContent = {
            from: user,
            to: toAddress,
            subject: `Re: ${message.envelope.subject}`,
            inReplyTo: message.envelope.messageId,
            references: message.envelope.messageId,
            text: quotedText,
            html: quotedHtml
        };

        const mail = new MailComposer({
            from: user,
            to: toAddress,
            subject: `Re: ${message.envelope.subject}`,
            inReplyTo: message.envelope.messageId,
            references: message.envelope.messageId,
            date: new Date().toUTCString(),
            text: quotedText,
            html: quotedHtml
        });

        const mimeMessageBuffer = await new Promise<Buffer>((resolve, reject) => {
            mail.compile().build((err, builtMessage) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(builtMessage);
                }
            });
        });

        return { mimeMessageBuffer, emailContent };
    } catch (err) {
        logger.error(`Ошибка при создании ответа ${toAddress ? 'на ' + toAddress : ''}:`, err);
        handleError(err, `Failed creating reply to ${toAddress || 'unknown'}`, 'createReplyBuffer');
        return { mimeMessageBuffer: null, emailContent: null };
    }
};

// Step 2: Send the email
export const sendReplyEmail = async (
    emailContent: EmailContent,
    user: string,
    smtpHost: string,
    auth: SmtpAuth,
): Promise<void> => {
    try {
        let authentication: AuthenticationType;
        if (auth.token) {
            authentication = { type: "OAUTH2", accessToken: auth.token, user: user };
        }
        else if (auth.password) {
            authentication = { type: "LOGIN", user: user, pass: auth.password };
        }
        else {
            throw new Error('No password or token provided for SMTP authentication');
        }

        // Try different port/security combinations
        const transportOptions: SMTPTransport.Options = {
            host: smtpHost,
            port: 587, // First attempt with standard STARTTLS port
            secure: false,
            auth: authentication,
            connectionTimeout: 5000, // 5 seconds
            greetingTimeout: 5000,
            socketTimeout: 10000,
            debug: true, // Enable debugging
            logger: false, // Log to console
            tls: {
                rejectUnauthorized: false // Allow self-signed certificates
            }
        };

        logger.info(`Попытка подключения к SMTP ${smtpHost}:${transportOptions.port}`);
        let transporter = nodemailer.createTransport(transportOptions);

        // Test connection before sending
        try {
            await transporter.verify();
            logger.info('SMTP соединение успешно проверено');
        } catch (verifyErr) {
            handleError(verifyErr, `Failed to connect with port 587 (STARTTLS)`, 'sendReplyEmail/verify');

            // Try again with port 465 (SSL)
            transportOptions.port = 465;
            transportOptions.secure = true; // Use SSL
            logger.info(`Повторная попытка с SSL соединением на порту 465`);

            try {
                transporter = nodemailer.createTransport(transportOptions);
                await transporter.verify();
                logger.info('SMTP SSL соединение успешно проверено');
            } catch (sslErr) {
                handleError(sslErr, `Failed to connect with port 465 (SSL)`, 'sendReplyEmail/verify');

                // One last try with port 25 (basic)
                transportOptions.port = 25;
                transportOptions.secure = false;
                logger.info(`Последняя попытка с базовым соединением на порту 25`);

                transporter = nodemailer.createTransport(transportOptions);
                // No verify for port 25 - just try to send
            }
        }

        // Then continue with your sendMail call
        try {
            const info = await transporter.sendMail({
                from: emailContent.from,
                to: emailContent.to,
                subject: emailContent.subject,
                inReplyTo: emailContent.inReplyTo,
                references: emailContent.references,
                envelope: {
                    from: emailContent.from,
                    to: emailContent.to
                },
                text: emailContent.text,
                html: emailContent.html
            });

            logger.info(`Ответ успешно отправлен через SMTP на ${emailContent.to}. ID сообщения: ${info.messageId}`);
        } catch (sendErr) {
            handleError(sendErr, `Failed to send reply via SMTP`, 'sendReplyEmail/sendMail');
        }
    } catch (err) {
        logger.error(`Ошибка при отправке ответа на ${emailContent.to}:`, err);
        handleError(err, `Failed sending reply to ${emailContent.to}`, 'sendReplyEmail');
    }
};


