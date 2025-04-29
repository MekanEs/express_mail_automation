import { FetchMessageObject, ImapFlow } from "imapflow";
// import { logger } from "../../utils/logger";
import MailComposer from "nodemailer/lib/mail-composer"
import { handleError } from "../../utils/error-handler";
import { simpleParser } from 'mailparser';
const warmupReplies = [
    'Благодарю за информацию. Обязательно учту в дальнейшей работе.',
    'Получил письмо, всё на месте. Если потребуется — уточню.',
    'Спасибо, сообщение дошло без проблем. Сохраню для дальнейшего использования.',
    'Информация принята, при необходимости свяжусь с вами повторно.',
    'Ознакомился с содержанием письма. Благодарю за оперативность.',
    'Данные получены, проверю и дам обратную связь при необходимости.',
    'Сообщение получено, никаких вопросов на данный момент нет.',
    'Письмо пришло, буду использовать как справочный материал.',
    'Спасибо за уведомление. Вижу всё в порядке.',
    'Отметил полученное письмо, вернусь к нему позже.',
    'Информация поступила. Принято к сведению.',
    'Письмо получено. Спасибо, всё понятно.',
    'Спасибо, получил. Свяжусь, если будут дополнительные вопросы.',
    'Подтверждаю получение письма. На текущий момент всё ясно.',
    'Информация получена, дальнейшие действия не требуются. Благодарю.'
];


export const createReply = async (client: ImapFlow, message: FetchMessageObject, user: string) => {
    try {

        if (!message?.envelope) throw new Error('Envelope not found');

        const toAddress = message.envelope.from[0].address;
        const text = warmupReplies[Math.floor(Math.random() * (warmupReplies.length - 1))]
        const parsed = await simpleParser(message.source);
        const qoutedHtml = `здравствуйте,\n${text}\n\n${message.envelope.from[0].name || ''}<${toAddress}>:\n\n<blackquote>${parsed.html}</blackquote>`

        const qoutedText = `здравствуйте,
         ${message.envelope.from[0].name || ''}<${toAddress}>:\n
        ${text}\n\n>${parsed.text}`

        const mail = new MailComposer({
            from: user,
            to: toAddress,
            subject: `Re: ${message.envelope.subject}`,
            inReplyTo: `${message.envelope.messageId}`,
            references: `${message.envelope.messageId}`,
            date: `${new Date().toUTCString()}`,
            text: qoutedText,
            html: qoutedHtml
        });

        const mimeMessageBuffer = await new Promise<Buffer>((resolve, reject) => {
            mail.compile().build((err, message) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(message);
                }
            });
        });
        const mailboxes = await client.list();
        const draftsMailbox = mailboxes.find(box => box.specialUse === '\\Drafts'
            || box.path.toLowerCase().includes('draft')
            || box.specialUse === '\\Черновики')

        if (!draftsMailbox) throw new Error('Drafts folder not found');
        return { path: draftsMailbox.path, mimeMessage: mimeMessageBuffer, flags: ['\\Draft'] }
    } catch (err) {
        console.error('Ошибка при создании ответа:', err);
        handleError(err, '', 'createReply')
    }
}
