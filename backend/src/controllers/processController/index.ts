import { Request } from 'express';
import { processMailbox } from '../../services/ProcessService';

class ProcessController {
  public async processEmails(req: Request): Promise<void> {
    const { start } = req.body;
    if (start === false) {
      console.log(start);
    }
    try {
      await processMailbox(
        'mekanesenjanov@ya.ru',
        'dvtgiixooxjbxevy',
        'flagman@flagmantech.email',
        'imap.yandex.com',
        ['INBOX'],
        'files'
      );
    } catch (err) {
      console.log(err);
    } finally {
      console.log('finished processing');
    }
  }
}
export const processController = new ProcessController();
