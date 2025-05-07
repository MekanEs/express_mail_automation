import { Request, Response } from 'express';
import { processMailbox } from '../services/process/processMailbox';
import { getConfig } from '../utils/getConfig';
import { ProcessRequestBody } from '../types/types';
import { v4 as uuidv4 } from 'uuid';
import { handleError } from '../utils/error-handler';
import { logger } from '../utils/logger';

class ProcessController {
  public async processEmails(
    req: Request<Record<string, string>, Record<string, string>, ProcessRequestBody>,
    res: Response
  ): Promise<void> {
    const { accounts, emails, limit = 100, openRate = 70, repliesCount = 0 } = req.body;

    const process_id = uuidv4();
    res.send({ process_id, message: 'Процесс запущен' });
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
          provider: account.provider,
          ...(account.is_token
            ? { token: account.access_token || '' }
            : { password: account.app_password || '' }),
          repliesCount
        };
        try {
          await processMailbox(processParams);
          console.error(`Обработано ${account.email} от ${from}:`);
        } catch (error) {
          handleError(error, `Ошибка при обработке ${account.email} от ${from}:`)
        }
      }
    }
    logger.info(`Завершение запроса на запуск процесса ${process_id}`);
  }
}
export const processController = new ProcessController();
