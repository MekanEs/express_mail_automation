import { ImapFlow } from "imapflow";
import { logger } from "../../../utils/logger";
import { handleError } from "../../../utils/error-handler";
interface searchMessagesArgs {
    from: string;
    client: ImapFlow;
    inbox: string;
    unseen?: boolean
}
export const searchMessages: ({
    from,
    client,
    inbox,
    unseen
}: searchMessagesArgs) => Promise<number[]> = async ({ from, client, inbox, unseen = true }) => {
    try {
        const list1 = await client.search({ from }, { uid: true });
        if (unseen) {
            const list2 = await client.search({ seen: false }, { uid: true });
            const list = list1.filter((el) => list2.includes(el));
            logger.info(`[${inbox}] Найдено писем: ${list.length}`);
            return list;
        } else {
            return list1
        }
    }
    catch (err) {
        handleError(err, 'error during messages search', 'searchMessages')
        return []
    }


};
