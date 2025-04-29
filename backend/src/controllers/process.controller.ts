import { Request, Response } from 'express';
import { processMailbox } from '../services/process/process.service';
import { getConfig } from '../utils/getConfig';
import { ProcessRequestBody } from '../types/types';
import { v4 as uuidv4 } from 'uuid';

class ProcessController {
  public async processEmails(
    req: Request<Record<string, string>, Record<string, string>, ProcessRequestBody>,
    res: Response
  ): Promise<void> {
    const { accounts, emails, limit = 100, openRate = 70, repliesCount = 0 } = req.body;

    const process_id = uuidv4();

    for (const account of accounts) {
      const providerConfig = getConfig(account.provider);

      for (const from of emails) {
        const processParams = {
          ...providerConfig,
          process_id: process_id,
          user: account.email || '',
          from,
          limit,
          openRate: openRate,
          outputPath: 'files',
          ...(account.is_token
            ? { token: account.access_token || '' }
            : { password: account.app_password || '' }),
          repliesCount
        };
        try {
          await processMailbox(processParams);
        } catch (error) {
          console.error(`Ошибка при обработке ${account.email} от ${from}:`, error);
        }
      }
    }

    res.send({ process_id, message: 'Процесс запущен' });
    console.log(`Завершение запроса на запуск процесса ${process_id}`);
  }
}
export const processController = new ProcessController();
