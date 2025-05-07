// src/services/process/processOrchestration.service.ts
import { ProcessRequestBody, } from '../../types/types';
import { getConfig } from '../../utils/getConfig'; // Глобальная конфигурация провайдеров
import { logger } from '../../utils/logger';
import { handleError } from '../../utils/error-handler';
import { accountProcessingService, AccountProcessingParams } from './accountProcessing.service'; // Наш новый сервис

interface StartProcessingParams extends ProcessRequestBody {
  process_id: string;
  // Можно добавить сюда другие глобальные параметры, если они появятся,
  // например, путь к базовой директории для файлов или настройки headless режима.
  baseOutputPath: string;
  headlessBrowser: boolean | "shell" | undefined;
}

export class ProcessOrchestrationService {
  /**
   * Запускает процесс обработки почтовых ящиков для указанных аккаунтов и email-адресов.
   * Эта функция предназначена для выполнения в фоновом режиме (например, после ответа контроллера).
   */
  public async startEmailProcessing(params: StartProcessingParams): Promise<void> {
    const {
      accounts,
      emails,
      limit = 100, // Значения по умолчанию, если не переданы
      openRate = 70,
      repliesCount = 0,
      process_id,
      baseOutputPath,
      headlessBrowser
    } = params;

    logger.info(`[Orchestration ID: ${process_id}] Запущен глобальный процесс обработки почты.`);
    logger.debug(`[Orchestration ID: ${process_id}] Параметры:`, { accountsCount: accounts.length, emailsCount: emails.length, limit, openRate, repliesCount });

    for (const account of accounts) {
      if (!account.email) {
        logger.warn(`[Orchestration ID: ${process_id}] Пропуск аккаунта без email: ID ${account.id}`);
        continue;
      }
      const providerConfig = getConfig(account.provider);
      if (!providerConfig) {
        logger.error(`[Orchestration ID: ${process_id}] Не найдена конфигурация для провайдера ${account.provider} аккаунта ${account.email}. Пропуск.`);
        // Здесь можно создать отчет об ошибке для этого аккаунта
        continue;
      }

      for (const fromEmail of emails) {
        logger.info(`[Orchestration ID: ${process_id}] Подготовка к обработке для аккаунта ${account.email} от ${fromEmail}.`);

        const accountProcessingParams: AccountProcessingParams = {
          account,
          fromEmail,
          providerConfig,
          process_id,
          limit,
          openRatePercent: openRate, // Переименовали для ясности в AccountProcessingParams
          repliesToAttempt: repliesCount, // Переименовали
          baseOutputPath,
          headlessBrowser
        };

        try {
          // Вызываем обработку для конкретного аккаунта и отправителя.
          // Не используем await здесь, если хотим, чтобы обработка разных аккаунтов/отправителей
          // шла "параллельно" (в рамках одного Node.js процесса, т.е. конкурентно).
          // Однако, это может создать большую нагрузку.
          // Для последовательной обработки (один за другим): await accountProcessingService.processAccountFromSender(...)
          // Для "параллельной" (конкурентной):
          accountProcessingService.processAccountFromSender(accountProcessingParams)
            .then(() => {
              logger.info(`[Orchestration ID: ${process_id}] Успешно завершена (или поставлена в очередь) обработка для ${account.email} от ${fromEmail}.`);
            })
            .catch(err => {
              // Эта ошибка должна быть уже залогирована внутри processAccountFromSender,
              // но можно добавить дополнительное логирование на уровне оркестратора.
              handleError(err, `[Orchestration ID: ${process_id}] Критическая ошибка при обработке ${account.email} от ${fromEmail} на уровне AccountProcessingService:`);
            });
          // Если нужна реальная параллельность, то каждая такая задача должна уходить в очередь,
          // а воркеры будут их разбирать. Пока что это конкурентное выполнение в одном потоке.

        } catch (orchestrationErr) {
          // Ошибки на уровне самого цикла оркестрации (маловероятно здесь, если нет await)
          handleError(orchestrationErr, `[Orchestration ID: ${process_id}] Ошибка в цикле оркестрации для ${account.email} от ${fromEmail}:`);
        }
      }
    }
    // Важно: этот лог появится сразу, если вызовы processAccountFromSender не ожидаются (без await).
    // Если они ожидаются, то после завершения всех.
    logger.info(`[Orchestration ID: ${process_id}] Все задачи по обработке почты были запущены/поставлены в очередь.`);
  }
}

export const processOrchestrationService = new ProcessOrchestrationService();
