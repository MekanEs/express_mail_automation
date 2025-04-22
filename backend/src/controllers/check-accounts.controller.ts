import { Request, Response } from 'express';
import { getConfig } from '../utils/getConfig';
import { createImapConfig } from '../utils/createConfig';
import { ImapFlow } from 'imapflow';
import { supabaseClient } from '../clients/supabaseClient';
import { getAccessToken } from '../utils/google_refresh';

class CheckAccountsController {
    public async checkAccounts(_req: Request, response: Response) {
        console.log('requst checkAccounts');
        const accounts = await supabaseClient.from('user_accounts').select()
        console.log(accounts)
        const connected: string[] = [];
        if (!accounts.data) {
            return;
        }
        console.log(accounts.data);
        for (const account of accounts.data) {

            const data = getConfig(account.provider || '');
            const { host } = data ? data : { host: '' };
            const config = createImapConfig({
                user: account.email || '',
                host,
                token: account.access_token || undefined,
                password: account.app_password || undefined
            });
            console.log('CONFIG CONFIG CONFIG', config, host);

            // ДОБАВЛЕНЫ ЛОГИ:
            console.log('Account email:', account.email);
            console.log('Account access_token:', account.access_token);
            console.log('ImapFlow config:', JSON.stringify(config, null, 2)); // Подробный вывод config

            const client = new ImapFlow({ ...config });
            try {
                await client.connect();
                const capa = await client.usable;
                const auth = await client.authenticated;
                console.log('IMAP capabilities:', capa);
                console.log('IMAP authenticated:', auth);
                connected.push(account.email || '');
            } catch (err) {
                console.log('check error', err); // Выводим полную ошибку
                if (account.provider === 'google') {
                    console.log(account.provider);
                    if (!account.refresh_token) {
                        return;
                    }
                    const new_acces_token = await getAccessToken(account.refresh_token);
                    console.log('✨new acces token', ':', new_acces_token, ':');
                    await supabaseClient
                        .from('user_accounts')
                        .update({ access_token: new_acces_token })
                        .eq('id', account.id);
                }
            }
        }
        response.status(200).send(connected);
    }
}

export const checkAccountsController = new CheckAccountsController();
