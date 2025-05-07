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
      logger.info(`Found 'Sent' mailbox: ${foundSentBox.path}`);
      return foundSentBox.path;
    } else {
      logger.warn(`Could not automatically detect 'Sent' mailbox for user ${user}. Replies will not be saved to Sent.`);
      return null;
    }
  } catch (listErr) {
    handleError(listErr, `Failed to list mailboxes to find Sent folder for ${user}`, 'client.list');
    return null;
  }
}