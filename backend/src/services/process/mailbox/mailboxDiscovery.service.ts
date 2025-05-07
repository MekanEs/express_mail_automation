// src/services/process/mailbox/mailboxDiscovery.service.ts
import { ImapFlow } from 'imapflow';
import { logger } from '../../../utils/logger';
import { handleError } from '../../../utils/error-handler';
// Мы не можем напрямую использовать imapClientService.listMailboxes здесь,
// так как это создаст циклическую зависимость, если imapClientService
// захочет использовать что-то из mailboxDiscoveryService (хотя в данном случае это маловероятно).
// Поэтому передаем клиент ImapFlow напрямую.

export class MailboxDiscoveryService {
  private async listMailboxesSafe(client: ImapFlow, user: string): Promise<ReturnType<ImapFlow['list']>> {
    try {
      return await client.list();
    } catch (err) {
      handleError(err, `[Mailbox Discovery] Не удалось получить список почтовых ящиков для ${user}`, 'listMailboxesSafe');
      return []; // Возвращаем пустой массив в случае ошибки
    }
  }
  
  public async findSentMailbox(client: ImapFlow, user: string): Promise<string | null> {
    logger.debug(`[Mailbox Discovery] Поиск папки "Отправленные" для пользователя ${user}`);
    const allMailboxes = await this.listMailboxesSafe(client, user);
    const foundSentBox = allMailboxes.find(box =>
      box.specialUse === '\\Sent' ||
      box.path.toLowerCase() === 'sent' ||
      box.path.toLowerCase() === 'sent items' ||
      box.path.toLowerCase() === 'отправленные'
    );
    
    if (foundSentBox) {
      logger.info(`[Mailbox Discovery] Найден ящик 'Отправленные' для ${user}: ${foundSentBox.path}`);
      return foundSentBox.path;
    } else {
      logger.warn(`[Mailbox Discovery] Не удалось автоматически обнаружить ящик 'Отправленные' для пользователя ${user}.`);
      return null;
    }
  }

  public async findDraftMailbox(client: ImapFlow, user: string): Promise<string | null> {
    logger.debug(`[Mailbox Discovery] Поиск папки "Черновики" для пользователя ${user}`);
    const allMailboxes = await this.listMailboxesSafe(client, user);
    const foundDraftBox = allMailboxes.find(box =>
      box.specialUse === '\\Drafts' || 
      box.path.toLowerCase() === 'drafts' ||
      box.path.toLowerCase() === 'draft' ||
      box.path.toLowerCase() === 'draftbox' ||
      box.path.toLowerCase() === 'черновики'
    );
    
    if (foundDraftBox) {
      logger.info(`[Mailbox Discovery] Найден ящик 'Черновики' для ${user}: ${foundDraftBox.path}`);
      return foundDraftBox.path;
    } else {
      logger.warn(`[Mailbox Discovery] Не удалось автоматически обнаружить ящик 'Черновики' для пользователя ${user}.`);
      return null;
    }
  }
}

export const mailboxDiscoveryService = new MailboxDiscoveryService();