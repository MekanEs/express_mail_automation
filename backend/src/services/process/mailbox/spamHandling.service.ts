import { ImapFlow } from 'imapflow';
import { logger } from '../../../utils/logger';
import { handleError } from '../../../utils/error-handler';
import { imapClientService } from '../client/imapClient.service';
import { searchMessagesService } from '../email/searchMessages.service';

export interface SpamCheckResult {
  totalSpamFound: number;
  totalSpamMoved: number;
  movedUidsMap: Map<number, number>; // Карта старых UID на новые UID после перемещения
}

export interface SpamFolderResult {
  spamFoundInFolder: number;
  spamMovedInFolder: number;
  movedUidsMap: Map<number, number>;
}

export class SpamHandlingService {
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

    const lock = await imapClientService.getMailboxLock(client, spamMailboxPath);
    if (!lock) {
      logger.warn(`[Spam Handling] Не удалось заблокировать спам-папку ${spamMailboxPath}, пропускаем.`);
      return { spamFoundInFolder, spamMovedInFolder, movedUidsMap };
    }

    try {
      logger.info(`[Spam Handling] Поиск писем от ${fromEmail} в спам-папке: ${spamMailboxPath}`);
      // Для спама обычно ищем все письма, не только непрочитанные
      const spamListUids = await searchMessagesService.search( // <--- ИСПРАВЛЕНО ЗДЕСЬ
        client,
        { from: fromEmail }, // Критерии поиска
        `Спам-папка: ${spamMailboxPath}` // Контекст для логирования
      );  // false для seenFlag

      spamFoundInFolder = spamListUids.length;
      logger.info(`[Spam Handling] Найдено ${spamFoundInFolder} писем от ${fromEmail} в ${spamMailboxPath}.`);

      if (spamListUids.length > 0) {
        try {
          logger.info(`[Spam Handling] Перемещение ${spamListUids.length} писем из ${spamMailboxPath} в ${targetInboxPath}.`);
          const { uidMap } = await client.messageMove(spamListUids, targetInboxPath, { uid: true });

          if (uidMap) {
            spamMovedInFolder = uidMap.size;
            uidMap.forEach((newUid, oldUid) => movedUidsMap.set(oldUid, newUid));
            logger.info(`[Spam Handling] Успешно перемещено ${spamMovedInFolder} писем. UID map size: ${uidMap.size}`);
          } else {
            logger.warn(`[Spam Handling] messageMove не вернул uidMap для ${spamMailboxPath}. Считаем, что перемещено ${spamListUids.length} (оценка).`);
            // В этом случае мы не можем точно знать новые UID, но можем считать, что все запрошенные были перемещены
            spamMovedInFolder = spamListUids.length;
          }
        } catch (moveErr) {
          handleError(moveErr, `[Spam Handling] Ошибка при перемещении писем из ${spamMailboxPath} в ${targetInboxPath}`, 'checkAndMoveSpamFromFolder.messageMove');
          // Если перемещение не удалось, не обновляем spamMovedInFolder
        }
      }
    } catch (searchErr) {
      handleError(searchErr, `[Spam Handling] Ошибка при поиске писем в спам-папке ${spamMailboxPath}`, 'checkAndMoveSpamFromFolder.search');
    } finally {
      await imapClientService.releaseMailboxLock(lock, spamMailboxPath);
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
      logger.info("[Spam Handling] Список спам-папок не настроен, проверка спама пропускается.");
      return overallResult;
    }

    logger.info(`[Spam Handling] Начало проверки спам-папок: ${configuredSpamFolderNames.join(', ')} для отправителя ${fromEmail}`);

    for (const spamPath of configuredSpamFolderNames) {
      // Здесь можно добавить логику поиска реального пути к спам-папке, если имена могут отличаться от реальных путей
      // Например, используя MailboxDiscoveryService.findSpamMailboxes
      // Пока предполагаем, что configuredSpamFolderNames содержит точные пути

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

    logger.info(`[Spam Handling] Завершена проверка спам-папок. Всего найдено: ${overallResult.totalSpamFound}, перемещено: ${overallResult.totalSpamMoved}.`);
    return overallResult;
  }
}

export const spamHandlingService = new SpamHandlingService();
