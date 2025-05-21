import { ListResponse } from 'imapflow';
import { MailboxType } from './mailboxDiscovery.service';
import { Provider } from '../../../types/types';
import { logger } from '../../../utils/logger';

export type StandardMailboxKey = 'sent' | 'drafts' | 'trash' | 'spam';

export interface StandardMailboxConfig {
  mailboxType: MailboxType;
  typeForLog: string;
  specialUseFlag: string;
}

export function getStandardMailboxConfig(key: StandardMailboxKey): StandardMailboxConfig {
  switch (key) {
    case 'sent':
      return { mailboxType: 'sent', typeForLog: 'Отправленные', specialUseFlag: '\\Sent' };
    case 'drafts':
      return { mailboxType: 'drafts', typeForLog: 'Черновики', specialUseFlag: '\\Drafts' };
    case 'trash':
      return { mailboxType: 'trash', typeForLog: 'Корзина', specialUseFlag: '\\Trash' };
    case 'spam':
      return { mailboxType: 'spam', typeForLog: 'Спам', specialUseFlag: '\\Junk' };
    default:
      // Это не должно произойти с типизированным StandardMailboxKey, но для полноты
      throw new Error(`Unknown standard mailbox key: ${key}`);
  }
}

export const gmailFallback: (mailboxes: ListResponse[], user: string, provider: Provider) => Promise<string | null> = async (mailboxes, u, prov) => {
  if (prov === 'google') {
    const gmailInboxFallback = mailboxes.find(box => box.path.toLowerCase() === 'inbox');
    if (gmailInboxFallback) {
      logger.info(`[Mailbox Discovery] Найден резервный Gmail Inbox для ${u}: ${gmailInboxFallback.path}`, true);
      return gmailInboxFallback.path;
    }
  }
  return null;
};
