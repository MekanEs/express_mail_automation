import { ImapFlow } from 'imapflow';
import { logger } from '../../../utils/logger';
import { handleError } from '../../../utils/error-handler';

export async function findSentMailbox(client: ImapFlow, user: string): Promise<string | null> {
  try {
    const allMailboxes = await client.list();
    const foundSentBox = allMailboxes.find(box =>
      box.specialUse === '\\Sent' ||
      box.path.toLowerCase() === 'sent' ||
      box.path.toLowerCase() === 'sent items' ||
      box.path.toLowerCase() === 'отправленные'
    );
    
    if (foundSentBox) {
      logger.info(`Найден ящик 'Отправленные': ${foundSentBox.path}`);
      return foundSentBox.path;
    } else {
      logger.warn(`Не удалось автоматически обнаружить ящик 'Отправленные' для пользователя ${user}. Ответы не будут сохранены в Отправленных.`);
      return null;
    }
  } catch (listErr) {
    handleError(listErr, `Failed to list mailboxes to find Sent folder for ${user}`, 'client.list');
    return null;
  }
}