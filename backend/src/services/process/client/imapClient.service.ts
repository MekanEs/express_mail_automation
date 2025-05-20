import { ImapFlow, MailboxLockObject } from 'imapflow';
import { createImapConfig } from '../../../utils/createConfig';
import { logger } from '../../../utils/logger';
import { handleError } from '../../../utils/error-handler';
import { injectable } from 'inversify';
import "reflect-metadata";

export interface IImapClientService {
  createImapClient(user: string, host: string, password?: string, token?: string): ImapFlow;
  connectClient(client: ImapFlow, userEmail: string): Promise<boolean>;
  disconnectClient(client: ImapFlow, userEmail: string): Promise<void>;
  getMailboxLock(client: ImapFlow, mailboxPath: string): Promise<MailboxLockObject | null>;
  releaseMailboxLock(lock: MailboxLockObject, mailboxPath: string): Promise<void>;
  listMailboxes(client: ImapFlow): Promise<ReturnType<ImapFlow['list']>>;
}

@injectable()
export class ImapClientService implements IImapClientService {
  public createImapClient(user: string, host: string, password?: string, token?: string): ImapFlow {
    const config = createImapConfig({ user, host, password, token, log: false });
    logger.debug(`[IMAP Client] Создана конфигурация IMAP для пользователя ${user}`);
    return new ImapFlow(config);
  }

  public async connectClient(client: ImapFlow, userEmail: string): Promise<boolean> {
    try {
      await client.connect();
      logger.info(`[IMAP Client] Успешное подключение к IMAP для ${userEmail}`);
      return true;
    } catch (err) {
      handleError(err, `[IMAP Client] Ошибка при подключении к почте для ${userEmail}:`, 'connectClient');
      return false;
    }
  }

  public async disconnectClient(client: ImapFlow, userEmail: string): Promise<void> {
    try {
      if (client.usable) {
        await client.logout();
        logger.debug(`[IMAP Client] Выход из IMAP клиента выполнен для ${userEmail}.`);
      } else {
        logger.debug(`[IMAP Client] IMAP клиент уже вышел из системы или недоступен для ${userEmail}.`);
      }
    } catch (logoutErr) {
      logger.error(`[IMAP Client] Ошибка при выходе из IMAP клиента для ${userEmail}:`, logoutErr);
    }
  }

  public async getMailboxLock(client: ImapFlow, mailboxPath: string): Promise<MailboxLockObject | null> {
    try {
      logger.debug(`[IMAP Client] Попытка блокировки ящика: ${mailboxPath}`);
      const lock = await client.getMailboxLock(mailboxPath);
      logger.debug(`[IMAP Client] Ящик ${mailboxPath} успешно заблокирован.`);
      return lock;
    } catch (err) {
      handleError(err, `[IMAP Client] Не удалось заблокировать почтовый ящик ${mailboxPath}`, 'getMailboxLock');
      return null;
    }
  }

  public async releaseMailboxLock(lock: MailboxLockObject, mailboxPath: string): Promise<void> {
    try {
      await lock.release();
      logger.debug(`[IMAP Client] Блокировка с ящика ${mailboxPath} снята.`);
    } catch (releaseErr) {
      logger.error(`[IMAP Client] Ошибка при снятии блокировки с ящика ${mailboxPath}:`, releaseErr);
    }
  }

  public async listMailboxes(client: ImapFlow): Promise<ReturnType<ImapFlow['list']>> {
    try {
      return await client.list();
    } catch (err) {
      handleError(err, `[IMAP Client] Не удалось получить список почтовых ящиков`, 'listMailboxes');
      return [];
    }
  }
}

// export const imapClientService = new ImapClientService(); // Original singleton export, now handled by DI
