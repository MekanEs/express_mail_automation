import { FetchMessageObject, ImapFlow } from "imapflow";
import { logger } from "../../utils/logger";
import { handleError } from "../../utils/error-handler";
const texts = ['Здравствуйте, Не следует, однако, забывать, что высококачественный прототип будущего проекта является качественно новой ступенью дальнейших направлений развития. Как уже неоднократно упомянуто, реплицированные с зарубежных источников, современные исследования ассоциативно распределены по отраслям. Современные технологии достигли такого уровня, что социально-экономическое развитие является качественно новой ступенью модели развития.',
    'Здравствуйте, Являясь всего лишь частью общей картины, некоторые особенности внутренней политики неоднозначны и будут превращены в посмешище, хотя само их существование приносит несомненную пользу обществу. Как принято считать, предприниматели в сети интернет будут заблокированы в рамках своих собственных рациональных ограничений. Являясь всего лишь частью общей картины, представители современных социальных резервов лишь добавляют фракционных разногласий и объективно рассмотрены соответствующими инстанциями.',
    'Здравствуйте, Современные технологии достигли такого уровня, что убеждённость некоторых оппонентов не оставляет шанса для вывода текущих активов. Для современного мира сплочённость команды профессионалов способствует повышению качества прогресса профессионального сообщества. Лишь представители современных социальных резервов будут обнародованы.']
export const createReply = async (client: ImapFlow, message: FetchMessageObject, user: string) => {
    try {

        if (!message?.envelope) throw new Error('Envelope not found');

        const fromAddress = message.envelope.to[0].address; // От кого оригинал пришел
        const toAddress = message.envelope.from[0].address; // Кому отправлять (ответ)
        const text = texts[Math.floor(Math.random() * (texts.length - 1))]

        const mimeContent = [
            `From: ${user}`,
            `To: ${fromAddress}`,
            `Subject: Re: ${message.envelope.subject}`,
            `In-Reply-To: ${message.envelope.messageId}`,
            `References: ${message.envelope.messageId}`,
            `Date: ${new Date().toUTCString()}`,
            `MIME-Version: 1.0`,
            `Content-Type: text/plain; charset=UTF-8`,
            ``,
            text
        ].join('\r\n');

        const mailboxes = await client.list();
        const draftsMailbox = mailboxes.find(box => box.specialUse === '\\Drafts'
            || box.path.toLowerCase().includes('draft')
            || box.specialUse === '\\Черновики')

        if (!draftsMailbox) throw new Error('Drafts folder not found');
        return { path: draftsMailbox.path, mimeMessage: mimeContent, flags: ['\\Draft'] }
    } catch (err) {
        console.error('Ошибка при создании ответа:', err);
        handleError(err, '', 'createReply')
    }
}
