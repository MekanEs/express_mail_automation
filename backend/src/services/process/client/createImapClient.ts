import { ImapFlow } from 'imapflow';
import { createImapConfig } from '../../../utils/createConfig';

export function createImapClient(user: string, host: string, password?: string, token?: string) {
  const config = createImapConfig({ user, host, password, token, log: false });
  return new ImapFlow(config);
}



