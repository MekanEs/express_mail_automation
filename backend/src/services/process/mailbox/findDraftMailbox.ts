import { ImapFlow } from 'imapflow';
import { logger } from '../../../utils/logger';
import { handleError } from '../../../utils/error-handler';

export async function findDraftMailbox(client: ImapFlow, user: string): Promise<string | null> {
  try {
    const allMailboxes = await client.list();
    const foundDraftBox = allMailboxes.find(box =>
      box.specialUse === '\\Draft' ||
      box.path.toLowerCase() === 'draft' ||
      box.path.toLowerCase() === 'drafts' ||
      box.path.toLowerCase() === 'draftbox' ||
      box.path.toLowerCase() === 'черновики'
    );
    
    if (foundDraftBox) {
      logger.info(`Найден ящик 'Черновики': ${foundDraftBox.path}`);
      return foundDraftBox.path;
    } else {
      logger.warn(`Не удалось автоматически обнаружить ящик 'Черновики' для пользователя ${user}. Ответы не будут сохранены в Черновики.`);
      return null;
    }
  } catch (listErr) {
    handleError(listErr, `Failed to list mailboxes to find Draft folder for ${user}`, 'client.list');
    return null;
  }
}