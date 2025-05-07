import { ImapFlow } from 'imapflow';
import { createImapConfig } from '../../utils/createConfig';
import { getConfig } from '../../utils/getConfig';
import { supabaseClient } from '../../clients/supabaseClient';
import { getAccessToken } from './google_refresh';
import { accounts } from '../../types/types';
import { logger } from '../../utils/logger';
import { createImapClient } from '../process/client/createImapClient';

export async function checkAccounts({
  accounts,
  connected
}: {
  accounts: accounts;
  connected: string[];
}) {
  for (const account of accounts) {
    const providerConfig = getConfig(account.provider);
  
    const client = createImapClient(account.email , providerConfig.host, account.app_password??undefined, account.access_token??undefined);
    try {
      await client.connect();
      connected.push(account.email);
      logger.info(`аккаунт ${account.email} подключен`)
    } catch (err) {
      if (account.provider === 'google' && account.refresh_token) {
        const new_acces_token = await getAccessToken(account.refresh_token);
        if (!new_acces_token) {
          return;
        }

        await supabaseClient
          .from('user_accounts')
          .update({ access_token: new_acces_token })
          .eq('id', account.id);
        logger.info(`получили новый token для  ${account.email}`)
        connected.push(account.email || '');
      } else {
        throw err;
      }
    } finally {
      if (client.usable) {
        await client.logout();
      }
    }
  }
}
