import { ImapFlow } from 'imapflow';
import { createImapConfig } from '../utils/createConfig';
import { getConfig } from '../utils/getConfig';
import { supabaseClient } from '../clients/supabaseClient';
import { getAccessToken } from '../utils/google_refresh';
import { accounts } from '../types/types';

export async function checkAccounts({
  accounts,
  connected
}: {
  accounts: accounts;
  connected: string[];
}) {
  for (const account of accounts) {
    const providerConfig = getConfig(account.provider);
    const imapConfig = createImapConfig({
      user: account.email || '',
      host: providerConfig.host,
      token: account.access_token || undefined,
      password: account.app_password || undefined
    });
    const client = new ImapFlow({ ...imapConfig });
    try {
      await client.connect();
      connected.push(account.email || '');
      console.log(`аккаунт ${account.email} подключен`)
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
        console.log(`получили новый token для  ${account.email}`)
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
