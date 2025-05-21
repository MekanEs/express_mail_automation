import { ImapFlow } from 'imapflow';
import { logger } from '../../../utils/logger';
import { handleError } from '../../../utils/error-handler';
import { injectable, inject } from 'inversify';
import "reflect-metadata";
import { TYPES } from '../../../common/types.di';
import { IImapClientService } from '../client/imapClient.service';
import { ISearchMessagesService } from '../email/searchMessages.service';

export interface SpamCheckResult {
  totalSpamFound: number;
  totalSpamMoved: number;
  movedUidsMap: Map<number, number>;
}

export interface SpamFolderResult {
  spamFoundInFolder: number;
  spamMovedInFolder: number;
  movedUidsMap: Map<number, number>;
}

export interface ISpamHandlingService {
  processAllSpamFolders(
    client: ImapFlow,
    configuredSpamFolderNames: string[],
    targetInboxPath: string,
    fromEmail: string
  ): Promise<SpamCheckResult>;
}

@injectable()
export class SpamHandlingService implements ISpamHandlingService {
  private readonly imapClientService: IImapClientService;
  private readonly searchMessagesService: ISearchMessagesService;

  constructor(
    @inject(TYPES.ImapClientService) imapClientService: IImapClientService,
    @inject(TYPES.SearchMessagesService) searchMessagesService: ISearchMessagesService
  ) {
    this.imapClientService = imapClientService;
    this.searchMessagesService = searchMessagesService;
  }

  /**
   * Проверяет одну спам-папку и перемещает письма от указанного отправителя в целевой ящик.
   */
  private async checkAndMoveSpamFromFolder(
    client: ImapFlow,
    spamMailboxPath: string,
    targetInboxPath: string,
    fromEmail: string
  ): Promise<SpamFolderResult> {
    let spamFoundInFolder = 0;
    let spamMovedInFolder = 0;
    const movedUidsMap = new Map<number, number>();

    const lock = await this.imapClientService.getMailboxLock(client, spamMailboxPath);
    if (!lock) {
      logger.warn(`[Spam Handling] Не удалось заблокировать спам-папку ${spamMailboxPath}, пропускаем.`, true);
      return { spamFoundInFolder, spamMovedInFolder, movedUidsMap };
    }

    try {
      logger.info(`[Spam Handling] Поиск писем от ${fromEmail} в спам-папке: ${spamMailboxPath}`, true);
      const spamListUids = await this.searchMessagesService.search(
        client,
        { from: fromEmail },
        `Спам-папка: ${spamMailboxPath}`
      );

      spamFoundInFolder = spamListUids.length;
      logger.info(`[Spam Handling] Найдено ${spamFoundInFolder} писем от ${fromEmail} в ${spamMailboxPath}.`, true);

      if (spamListUids.length > 0) {
        try {
          logger.info(`[Spam Handling] Перемещение ${spamListUids.length} писем из ${spamMailboxPath} в ${targetInboxPath}.`, true);
          const { uidMap } = await client.messageMove(spamListUids, targetInboxPath, { uid: true });

          if (uidMap) {
            spamMovedInFolder = uidMap.size;
            uidMap.forEach((newUid, oldUid) => movedUidsMap.set(oldUid, newUid));
            logger.info(`[Spam Handling] Успешно перемещено ${spamMovedInFolder} писем. UID map size: ${uidMap.size}`, true);
          } else {
            logger.warn(`[Spam Handling] messageMove не вернул uidMap для ${spamMailboxPath}. Считаем, что перемещено ${spamListUids.length} (оценка).`, true);
            spamMovedInFolder = spamListUids.length;
          }
        } catch (moveErr) {
          handleError(moveErr, `[Spam Handling] Ошибка при перемещении писем из ${spamMailboxPath} в ${targetInboxPath}`, 'checkAndMoveSpamFromFolder.messageMove');
        }
      }
    } catch (searchErr) {
      handleError(searchErr, `[Spam Handling] Ошибка при поиске писем в спам-папке ${spamMailboxPath}`, 'checkAndMoveSpamFromFolder.search');
    } finally {
      await this.imapClientService.releaseMailboxLock(lock, spamMailboxPath);
    }
    return { spamFoundInFolder, spamMovedInFolder, movedUidsMap };
  }

  /**
   * Обрабатывает все сконфигурированные спам-папки.
   * @param client - IMAP клиент
   * @param configuredSpamFolderNames - Массив имен спам-папок (например, ['Spam', 'Bulk Mail'])
   * @param targetInboxPath - Путь к основному инбоксу, куда перемещать письма
   * @param fromEmail - Email отправителя, чьи письма ищем в спаме
   */
  public async processAllSpamFolders(
    client: ImapFlow,
    configuredSpamFolderNames: string[],
    targetInboxPath: string,
    fromEmail: string
  ): Promise<SpamCheckResult> {
    const overallResult: SpamCheckResult = {
      totalSpamFound: 0,
      totalSpamMoved: 0,
      movedUidsMap: new Map<number, number>()
    };

    if (!configuredSpamFolderNames || configuredSpamFolderNames.length === 0) {
      logger.info("[Spam Handling] Список спам-папок не настроен, проверка спама пропускается.", true);
      return overallResult;
    }

    logger.info(`[Spam Handling] Начало проверки спам-папок: ${configuredSpamFolderNames.join(', ')} для отправителя ${fromEmail}`, true);

    for (const spamPath of configuredSpamFolderNames) {
      const { spamFoundInFolder, spamMovedInFolder, movedUidsMap } = await this.checkAndMoveSpamFromFolder(
        client,
        spamPath,
        targetInboxPath,
        fromEmail
      );
      overallResult.totalSpamFound += spamFoundInFolder;
      overallResult.totalSpamMoved += spamMovedInFolder;
      movedUidsMap.forEach((newUid, oldUid) => overallResult.movedUidsMap.set(oldUid, newUid));
    }

    logger.info(`[Spam Handling] Завершена проверка спам-папок. Всего найдено: ${overallResult.totalSpamFound}, перемещено: ${overallResult.totalSpamMoved}.`, true);
    return overallResult;
  }
}

// export const spamHandlingService = new SpamHandlingService(imapClientService, searchMessagesService); // Original singleton export, now handled by DI
