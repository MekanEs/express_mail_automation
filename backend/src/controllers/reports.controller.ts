import { Request, Response } from 'express';
import { supabaseClient } from '../clients/supabaseClient';
import { ReportType } from '../types/types'; // Предполагаем, что тип report определен

class ReportsController {
  public async getReports(req: Request, response: Response): Promise<void> {
    // Параметры из запроса с значениями по умолчанию
    const {
      page = '1',
      limit = '10', // Уменьшим лимит по умолчанию для пагинации групп
      sort_by = 'created_at',
      sort_order = 'desc',
      filter_status,
      filter_account,
      filter_process_id // Добавим фильтр по process_id
    } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);

    if (isNaN(pageNumber) || pageNumber < 1) {
      response.status(400).send({ error: 'Invalid page number' });
      return;
    }
    if (isNaN(pageSize) || pageSize < 1) {
      response.status(400).send({ error: 'Invalid limit value' });
      return;
    }

    try {
      // Создаем базовый запрос
      let query = supabaseClient.from('reports').select<string, ReportType>('*'); // Указываем тип report

      // Применяем фильтры
      if (filter_status) {
        query = query.eq('status', filter_status as string);
      }
      if (filter_account) {
        query = query.eq('account', filter_account as string);
      }
      if (filter_process_id) {
        query = query.eq('process_id', filter_process_id as string);
      }

      // Применяем сортировку (важно для порядка групп и элементов внутри)
      query = query.order(sort_by as string, { ascending: sort_order === 'asc' });

      // Получаем все отфильтрованные и отсортированные данные для группировки
      const { data, error } = await query;

      if (error) {
        console.error('Ошибка Supabase при получении отчетов:', error);
        throw new Error(error.message || 'Ошибка при получении отчетов');
      }

      if (!data) {
        // Если данных нет после фильтрации, возвращаем пустой результат
        response.status(200).send({
          data: [],
          pagination: { page: pageNumber, limit: pageSize, total: 0, pages: 0 }
        });
        return;
      }

      // Используем Map для группировки и сохранения порядка
      const groupedMap = new Map<string, ReportType[]>();
      for (const item of data) {
        const processId = item.process_id || 'unknown';
        if (!groupedMap.has(processId)) {
          groupedMap.set(processId, []);
        }
        groupedMap.get(processId)!.push(item);
      }

      // Преобразуем Map в массив групп для пагинации
      const allGroups = Array.from(groupedMap.entries()).map(([processId, reports]) => ({
        processId,
        reports
      }));

      // Применяем пагинацию к массиву групп
      const totalGroups = allGroups.length;
      const totalPages = Math.ceil(totalGroups / pageSize);
      const paginatedGroups = allGroups.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

      // Возвращаем пагинированные группы и метаданные
      response.status(200).send({
        data: paginatedGroups,
        pagination: {
          page: pageNumber,
          limit: pageSize,
          total: totalGroups,
          pages: totalPages
        }
      });
    } catch (err) {
      console.error('Ошибка при получении отчетов:', err);
      // Проверяем, является ли err экземпляром Error
      const errorMessage = err instanceof Error ? err.message : 'Внутренняя ошибка сервера';
      // Отправляем стандартизированный ответ об ошибке
      response.status(500).send({ error: errorMessage });
    }
  }
  public async deleteReports(req: Request, response: Response): Promise<void> {
    const { process_id } = req.body;
    const { error } = await supabaseClient.from('reports').delete().eq('process_id', process_id);
    if (error) {
      response.status(500).send({ error: error.message });
    }
    response.status(200).send({ message: 'Reports deleted successfully' });
  }

  public async deleteEmptyReports(req: Request, response: Response): Promise<void> {
    try {
      // Удаляем отчеты где emails_found равно 0 или null
      const { error } = await supabaseClient
        .from('reports')
        .delete()
        .or('emails_found.is.null,emails_found.eq.0');

      if (error) {
        console.error('Error deleting empty reports:', error);
        response.status(500).send({ error: error.message });
        return;
      }

      response.status(200).send({
        message: 'Empty reports deleted successfully'
      });
    } catch (err) {
      console.error('Unexpected error when deleting empty reports:', err);
      response.status(500).send({
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  }

  public async deleteBySender(req: Request, response: Response): Promise<void> {
    try {
      const { sender } = req.body;

      if (!sender) {
        response.status(400).send({ error: 'Sender parameter is required' });
        return;
      }

      // В Supabase JS SDK v2 .delete() может возвращать count если указать { count: 'exact' }
      const { error, count } = await supabaseClient
        .from('reports')
        .delete({ count: 'exact' })
        .eq('sender', sender as string);

      if (error) {
        console.error('Error deleting reports by sender:', error);
        response.status(500).send({ error: error.message });
        return;
      }

      response.status(200).send({
        message: `Reports from sender "${sender}" deleted successfully`,
        deletedCount: count === null ? 0 : count // count может быть null, если ничего не удалено или ошибка
      });
    } catch (err) {
      console.error('Unexpected error when deleting reports by sender:', err);
      response.status(500).send({
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  }
}
export const reportsController = new ReportsController();
