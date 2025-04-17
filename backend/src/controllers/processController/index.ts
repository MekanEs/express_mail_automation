import { Request } from 'express';
import { processMailbox } from '../../services/ProcessService';
import { getConfig } from '../../utils/getConfig';
import { accounts, from_email } from '../../types/types';

class ProcessController {
  public async processEmails(
    req: Request<
      Record<string, string>,
      Record<string, string>,
      { accounts: accounts; emails: from_email[]; limit?: number }
    >
  ): Promise<void> {
    const { accounts, emails, limit = 20 } = req.body;

    console.log(accounts.map((el) => el.email).join(', '));

    try {
      for (const account of accounts) {
        console.log(`✅ account ${account.email}`, account);
        const config = getConfig(account.provider ?? '');
        if (!config) {
          continue;
        }
        for (const from_email of emails) {
          console.log(`✅ from email ${from_email.email}`);
          if (account.is_token) {
            await processMailbox({
              user: account.email || '',
              from: from_email.email,
              host: config.host,
              mailboxes: config.mailboxes,
              limit: limit,
              outputPath: 'files',
              token: account.access_token || ''
            });
          } else {
            await processMailbox({
              user: account.email || '',
              from: from_email.email,
              host: config.host,
              mailboxes: config.mailboxes,
              limit: limit,
              outputPath: 'files',
              password: account.app_password || ''
            });
          }
        }
      }
      // await processMailbox(
      //   'mekanesenjanov@ya.ru',
      //   'dvtgiixooxjbxevy',
      //   'flagman@flagmantech.email',
      //   'imap.yandex.com',
      //   ['INBOX'],
      //   'files'
      // );
    } catch (err) {
      console.log(err);
    } finally {
      console.log('finished processing');
    }
  }
}
export const processController = new ProcessController();
