import { ImapFlow, SearchObject } from 'imapflow';
import { logger } from '../../../utils/logger';
import { handleError } from '../../../utils/error-handler';
import { injectable } from 'inversify';
import "reflect-metadata";

export interface SearchParams {
  client: ImapFlow;
  criteria: SearchObject;
  logContext?: string;
}

export interface ISearchMessagesService {
  search(
    client: ImapFlow,
    criteria: SearchObject,
    logContext?: string
  ): Promise<number[]>;
  searchUnseenFromSender(client: ImapFlow, fromEmail: string): Promise<number[]>;
}

@injectable()
export class SearchMessagesService implements ISearchMessagesService {
  /**
   * Ищет UID сообщений в указанном почтовом ящике по заданным критериям.
   * @param client - IMAP клиент.
   * @param mailboxPath - Путь к почтовому ящику (неявно используется текущий открытый ящик, если getMailboxLock был вызван).
   * @param criteria - Критерии поиска ImapFlow.
   * @param logContext - Контекст для логирования (например, email пользователя или тип поиска).
   * @returns Массив UID или пустой массив в случае ошибки.
   */
  public async search(
    client: ImapFlow,
    criteria: SearchObject,
    logContext: string = ''
  ): Promise<number[]> {
    const criteriaString = JSON.stringify(criteria); // Для логирования
    try {
      logger.debug(`[SearchMessages Service] ${logContext} Поиск сообщений с критериями: ${criteriaString}`);
      const uids: number[] = await client.search(criteria, { uid: true });
      logger.info(`[SearchMessages Service] ${logContext} Найдено ${uids.length} UID(ов) по критериям: ${criteriaString}.`);
      return uids;
    } catch (err) {
      handleError(err, `[SearchMessages Service] ${logContext} Ошибка при поиске сообщений (${criteriaString})`, 'search');
      return [];
    }
  }

  /**
   * Ищет непрочитанные сообщения от указанного отправителя.
   * @param client - IMAP клиент.
   * @param mailboxPath - Путь к почтовому ящику.
   * @param fromEmail - Email отправителя.
   * @returns Массив UID.
   */
  public async searchUnseenFromSender(client: ImapFlow, fromEmail: string): Promise<number[]> {
    // Комбинированные критерии
    // Некоторые серверы могут не поддерживать сложные AND операции напрямую в одном search.
    // Более надежно сделать два запроса и пересечь результаты.
    try {
      const fromCriteria: SearchObject = { from: fromEmail };
      const unseenCriteria: SearchObject = { seen: false };

      logger.debug(`[SearchMessages Service] Поиск писем от ${fromEmail} (всех)`);
      const listFrom = await client.search(fromCriteria, { uid: true });

      logger.debug(`[SearchMessages Service] Поиск непрочитанных писем (всех)`);
      const listUnseen = await client.search(unseenCriteria, { uid: true });

      const resultUids = listFrom.filter(uid => listUnseen.includes(uid));

      logger.info(`[SearchMessages Service] Найдено ${resultUids.length} непрочитанных писем от ${fromEmail}.`);
      return resultUids;
    } catch (err) {
      handleError(err, `[SearchMessages Service] Ошибка при поиске непрочитанных писем от ${fromEmail}`, 'searchUnseenFromSender');
      return [];
    }
  }
}

