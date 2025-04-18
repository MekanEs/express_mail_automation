import { Request, Response } from 'express';
import { processMailbox } from '../../services/ProcessService';
import { getConfig } from '../../utils/getConfig';
import { accounts, from_email } from '../../types/types';

class ProcessController {
  public async processEmails(
    req: Request<
      Record<string, string>,
      Record<string, string>,
      { accounts: accounts; emails: from_email[]; limit?: number }
    >,
    res: Response
  ): Promise<void> {
    const { accounts, emails, limit = 20 } = req.body;

    console.log(accounts.map((el) => el.email).join(', '));
    console.log(emails);
    try {
      for (const account of accounts) {
        console.log(`✅ account ${account.email}`, account);
        const config = getConfig(account.provider ?? '');
        if (!config) {
          console.log('continue');

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
      res.send({ is_proceeded: '+' });
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
      res.send({ is_proceeded: 'x' });
    } finally {
      console.log('finished processing');
    }
  }
}
export const processController = new ProcessController();
