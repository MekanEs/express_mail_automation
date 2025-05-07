import { ImapFlow } from "imapflow";
import { searchMessages } from "../utils/searchUnseen";
import { handleError } from "../../../utils/error-handler";
import { logger } from "../../../utils/logger";
interface SpamBoxCheckAndReMoveArgs {
    client: ImapFlow;
    spamBoxPath: string;
    inboxPath: string;
    from: string;
}
const spamBoxCheckAndReMove = async ({
    client,
    spamBoxPath,
    inboxPath,
    from
}: SpamBoxCheckAndReMoveArgs) => {
    let spamLock;
    try {
        spamLock = await client.getMailboxLock(spamBoxPath);
        logger.info('получена блокировка', spamBoxPath);
        const spamList = await searchMessages({ from, client, inbox: spamBoxPath });
        logger.info('найдены сообщения', spamList);
        const { uidMap } = await client.messageMove(spamList, inboxPath, { uid: true });
        logger.info(`перемещено из ${spamBoxPath}: `, spamList.length, uidMap?.size, ' писем');
        return { spamList, uidMap };
    } catch (err) {
        handleError(err, 'error during spam checking', 'spamBoxCheckAndReMove')
    } finally {
        if (spamLock) {
            try {
                await spamLock.release();
                logger.debug('блокировка снята')
            } catch (releaseErr) {
                logger.error('Ошибка при снятии блокировки:', releaseErr);
            }
        }
    }
    return { spamList: [], uidMap: new Map() };
};
interface SpamBoxesCheckArgs {
    client: ImapFlow;
    spamBoxes: string[];
    inboxPath: string;
    from: string;
}

export const spamBoxesCheck = async ({
    client,
    spamBoxes,
    inboxPath,
    from
}: SpamBoxesCheckArgs) => {
    const spamListResult = []
    const uidMaps: Map<number, number> = new Map()
    for (const spamPath of spamBoxes) {
        try {
            const { spamList, uidMap } = await spamBoxCheckAndReMove({ client, from, inboxPath, spamBoxPath: spamPath })
            spamListResult.push(...spamList)
            if (uidMap && uidMap.size > 0) {
                for (const [oldUid, newUid] of uidMap.entries()) {
                    uidMaps.set(oldUid, newUid);
                }
            }
        }
        catch (err) {
            handleError(err, 'error during spam checking', 'spamBoxesCheck')
        }
    }
    return { spamListResult, uidMaps };
}
