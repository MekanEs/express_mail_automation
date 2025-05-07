import { ImapFlow } from 'imapflow';
import { createImapConfig } from '../../../utils/createConfig';
import { logger } from '../../../utils/logger';

export function createImapClient(user: string, host: string, password?: string, token?: string) {
  const config = createImapConfig({ user, host, password, token });
  logger.info("Создана конфигурация IMAP");
  return new ImapFlow(config);
}



