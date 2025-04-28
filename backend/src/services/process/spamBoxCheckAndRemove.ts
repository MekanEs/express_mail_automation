import { ImapFlow } from "imapflow";
import { searchMessages } from "./utils/searchUnseen";
import { handleError } from "../../utils/error-handler";
import { logger } from "../../utils/logger";

const spamBoxCheckAndReMove = async ({
    client,
    spamBoxPath,
    inboxPath,
    from
}: {
    client: ImapFlow;
    spamBoxPath: string;
    inboxPath: string;
    from: string;
}) => {
    let spamLock;
    try {


        spamLock = await client.getMailboxLock(spamBoxPath);
        logger.info('got lock', spamBoxPath);
        const spamList = await searchMessages({ from, client, inbox: spamBoxPath });
        logger.info('found messages', spamList);
        const { uidMap } = await client.messageMove(spamList, inboxPath, { uid: true });
        logger.info(`перемещено из ${spamBoxPath}: `, spamList.length, uidMap?.size, ' писем');
        return { spamList, uidMap };
    } catch (err) {
        handleError(err, 'error during spam checking', 'spamBoxCheckAndReMove')
    } finally {
        if (spamLock) {
            try {
                await spamLock.release();
                logger.debug('lock released')
            } catch (releaseErr) {
                logger.error('Ошибка при release lock:', releaseErr);
            }
        }

    }
    return { spamList: [], uidMap: new Map() };
};
export const spamBoxesCheck = async ({
    client,
    spamBoxes,
    inboxPath,
    from
}: {
    client: ImapFlow;
    spamBoxes: string[];
    inboxPath: string;
    from: string;
}) => {
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
