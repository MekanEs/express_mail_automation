import { ImapFlow } from "imapflow";
import { handleError } from "../../../utils/error-handler";
import { logger } from "../../../utils/logger";

export const markMessagesAsSeen = async (client: ImapFlow, markAsSeen: number[]) => {
    try {
        await client.messageFlagsAdd(markAsSeen, ['\\Seen'], { uid: true })
        logger.info(`Письма помечены как прочитанные: ${markAsSeen.join(', ')}`);
    } catch (err) {
        handleError(err, 'Ошибка при пометке писем как прочитанных.', 'markMessagesAsSeen')
    }
}

