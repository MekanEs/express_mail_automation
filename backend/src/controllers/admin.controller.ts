import { Request, Response } from 'express';
import { supabaseClient } from '../clients/supabaseClient';
import { logger } from '../utils/logger';

class AdminController {
  public async archiveSenderAggregates(_req: Request, res: Response) {
    try {
      // 1. Получаем все текущие данные из sender_aggregates
      const { data: currentAggregates, error: fetchError } = await supabaseClient
        .from('sender_aggregates')
        .select('*');

      if (fetchError) {
        logger.error('Ошибка при получении sender_aggregates для архивации:', fetchError);
        res.status(500).json({ message: 'Не удалось получить текущие агрегаты', error: fetchError.message });

        return
      }

      if (!currentAggregates || currentAggregates.length === 0) {
        logger.info('Нет данных в sender_aggregates для архивации.');
        res.status(200).json({ message: 'Нет данных в sender_aggregates для архивации.', count: 0 });
        return;
      }

      // 2. Используем upsert для вставки/обновления данных в sender_aggregates_archive
      // Это предполагает, что 'sender' является первичным ключом или имеет уникальное ограничение
      // в таблице sender_aggregates_archive для корректной работы onConflict.
      const { error: upsertError, count } = await supabaseClient
        .from('sender_aggregates_archive')
        .upsert(currentAggregates, { onConflict: 'sender' }); // Укажите колонку для разрешения конфликтов

      if (upsertError) {
        logger.error('Ошибка при upsert в sender_aggregates_archive:', upsertError);
        res.status(500).json({ message: 'Не удалось архивировать агрегаты отправителей', error: upsertError.message });
        return;
      }

      const message = `Успешно заархивировано ${count ?? currentAggregates.length} записей агрегатов отправителей.`;
      logger.info(message);
      res.status(200).json({ message, count: count ?? currentAggregates.length });
      return;
    } catch (err) {
      logger.error('Неожиданная ошибка в archiveSenderAggregates:', err);
      const errorMessage = err instanceof Error ? err.message : 'Произошла неизвестная ошибка';
      res.status(500).json({ message: 'Произошла неожиданная ошибка при архивации', error: errorMessage });
      return;
    }
  }
}
export const adminController = new AdminController();
