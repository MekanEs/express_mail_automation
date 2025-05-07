import { ImapFlow } from "imapflow";
import { handleError } from "../../../utils/error-handler";
import { logger } from "../../../utils/logger";
import { Provider } from "../../../types/types";

interface appendReplyArgs { replySentSuccessfully: boolean; ReplyBuffer: Buffer<ArrayBufferLike> | null; sentMailboxPath: string | null; draftMailboxPath: string | null; client: ImapFlow; provider: Provider; uid: number }
export const appendReply = async ({ replySentSuccessfully, ReplyBuffer, sentMailboxPath, draftMailboxPath, client, provider, uid }: appendReplyArgs) => {
    console.log(!!ReplyBuffer,replySentSuccessfully)
    if (provider !== 'google') {
        if (replySentSuccessfully && ReplyBuffer && sentMailboxPath) {
            try {
                logger.info(`Добавление отправленного ответа для UID ${uid} в ${sentMailboxPath}`);
                const appendResult = await client.append(sentMailboxPath, ReplyBuffer, ['\\Seen']);
                logger.info(`Ответ успешно добавлен в ${sentMailboxPath}`, appendResult);
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (appendErr) {
                logger.error(`Не удалось добавить отправленный ответ для UID ${uid} в ${sentMailboxPath}`, appendErr);
                handleError(appendErr, `Failed to append reply to Sent folder for UID ${uid}`, 'client.append');
            }
        }
        else if (!replySentSuccessfully && ReplyBuffer && draftMailboxPath) {
            try {
                logger.info(`Добавление черновика для UID ${uid} в ${draftMailboxPath}`);
                const appendResult = await client.append(draftMailboxPath, ReplyBuffer, ['\\Seen']);
                logger.info(`Черновик успешно добавлен в ${draftMailboxPath}`, appendResult);
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (appendErr) {
                logger.error(`Не удалось добавить черновик ответа для UID ${uid} в ${draftMailboxPath}`, appendErr);
                handleError(appendErr, `Failed to append draft reply to Draft folder for UID ${uid}`, 'client.append');
            }
        }
    }
}