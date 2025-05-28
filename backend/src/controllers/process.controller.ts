// backend/src/controllers/process.controller.ts (Изменения)
import { Request, Response } from 'express';
import { ProcessRequestBody, StartProcessResponse, ProcessConfig, Accounts } from '../types/types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
// import { processOrchestrationService } from '../services/process/processOrchestration.service'; // Больше не вызываем напрямую
import { addProcessJob } from '../queue/pgQueueService'; // Импортируем функцию добавления задачи
import { ProcessJobData } from '../types/queueTypes'; // Импортируем тип данных задачи
import { supabaseClient } from '../clients/supabaseClient';

class ProcessController {
  public async processEmails(
    req: Request<Record<string, string>, Record<string, string>, ProcessRequestBody>,
    res: Response,
  ): Promise<void> {
    const { accounts, emails, limit, openRate, repliesCount, headlessMode } = req.body;

    if (!accounts || accounts.length === 0 || !emails || emails.length === 0) {
      res.status(400).send({ message: 'Параметры "accounts" и "emails" обязательны и не должны быть пустыми.' });
      return;
    }
    const { data: loadedAccounts } = await supabaseClient.from('user_accounts').select()
    const process_id = uuidv4(); // Ваш уникальный ID процесса
    const processAccs: Accounts | undefined = loadedAccounts?.filter(acc => accounts.some((localAcc) => localAcc.id === acc.id))
    // Create ProcessConfig object
    const processConfig: ProcessConfig = {
      limit: limit !== undefined ? limit : 100, // Provide default if undefined
      openRate: openRate !== undefined ? openRate : 70,
      repliesCount: repliesCount !== undefined ? repliesCount : 0,
      // Add other default values for ProcessConfig fields if necessary
    };
    logger.warn(accounts, processAccs, true)
    const jobPayload: ProcessJobData = {
      process_id,
      accounts: processAccs ?? accounts, // Assuming accounts are already Omit<Account, 'is_selected'> or conversion happens elsewhere
      emails: emails.filter((email): email is string => email !== null),
      config: processConfig, // Use the created config object
      baseOutputPath: 'files',
      headlessMode: headlessMode // Добавляем headlessMode в payload
    };

    try {
      // Добавляем задачу в очередь graphile-worker
      const graphileWorkerJobId = await addProcessJob(jobPayload);

      logger.info(`[Controller ID: ${process_id}] Задача добавлена в очередь Graphile-Worker с ID: ${graphileWorkerJobId}`);

      // Отвечаем клиенту немедленно
      const response: StartProcessResponse = {
        process_id, // Возвращаем ваш сгенерированный ID процесса
        message: 'Запрос на обработку почты принят и добавлен в очередь.'
      };
      res.status(202).send(response); // 202 Accepted

    } catch (queueError) {
      logger.error(
        `[Controller ID: ${process_id}] Ошибка при добавлении задачи в очередь:`,
        queueError
      );
      // В случае ошибки добавления в очередь, отправляем 500
      res.status(500).send({
        process_id, // Возвращаем ID, если он был сгенерирован до ошибки
        message: 'Не удалось добавить запрос на обработку в очередь. Попробуйте позже.'
      });
    }
  }
}
export const processController = new ProcessController();
