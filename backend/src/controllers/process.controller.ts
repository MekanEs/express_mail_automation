import { Request, Response, } from 'express';
import { ProcessRequestBody, StartProcessingParams } from '../types/types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { processOrchestrationService } from '../services/process/processOrchestration.service';

class ProcessController {
  public async processEmails(
    req: Request<Record<string, string>, Record<string, string>, ProcessRequestBody>,
    res: Response,
  ): Promise<void> {
    const { accounts, emails, limit, openRate, repliesCount } = req.body;

    if (!accounts || accounts.length === 0 || !emails || emails.length === 0) {
      res.status(400).send({ message: 'Параметры "accounts" и "emails" обязательны и не должны быть пустыми.' });
      return;
    }

    const process_id = uuidv4();

    res.status(202).send({
      process_id,
      message: 'Запрос на обработку почты принят и выполняется в фоновом режиме.'
    });

    const orchestrationParams: StartProcessingParams = {
      accounts,
      emails,
      limit,
      openRate,
      repliesCount,
      process_id,
      baseOutputPath: 'files',
    };

    // Запускаем длительную обработку асинхронно
    processOrchestrationService.startEmailProcessing(orchestrationParams)
      .catch((err) => {
        // Эта ошибка маловероятна, если startEmailProcessing сам обрабатывает ошибки внутри циклов.
        // Но если сама функция startEmailProcessing выбросит исключение до начала циклов, оно попадет сюда.
        logger.error(
          `[Controller Process ID: ${process_id}] Критическая непредвиденная ошибка в запуске фоновой задачи processEmails:`,
          err
        );
        // Ошибку клиенту уже не отправить, так как ответ 202 был дан.
        // Здесь можно отправить уведомление в систему мониторинга.
      });
  }
}
export const processController = new ProcessController();
