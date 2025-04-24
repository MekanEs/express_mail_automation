import { Request, Response } from 'express';
import { supabaseClient } from '../clients/supabaseClient';
import { report } from '../types/types'; // Предполагаем, что тип report определен
import Papa from 'papaparse'; // Импортируем papaparse

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
            let query = supabaseClient
                .from('reports')
                .select<string, report>('*'); // Указываем тип report

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
            const groupedMap = new Map<string, report[]>();
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

    // Метод для экспорта отчетов
    public async exportReports(req: Request, res: Response): Promise<void> {
        // Принимаем все параметры фильтрации и сортировки
        const {
            format = 'csv',
            sort_by = 'created_at',
            sort_order = 'desc',
            filter_status,
            filter_account,
            filter_process_id // Добавляем этот фильтр
        } = req.query;

        try {
            let query = supabaseClient.from('reports').select<string, report>('*');

            // Применяем все полученные фильтры
            if (filter_status) {
                query = query.eq('status', filter_status as string);
            }
            if (filter_account) {
                query = query.eq('account', filter_account as string);
            }
            if (filter_process_id) { // Добавляем условие для filter_process_id
                query = query.eq('process_id', filter_process_id as string);
            }

            // Применяем сортировку
            query = query.order(sort_by as string, { ascending: sort_order === 'asc' });

            const { data, error } = await query;

            if (error) {
                console.error('Ошибка при получении данных для экспорта:', error);
                res.status(500).send({ error: error.message || 'Ошибка получения данных для экспорта' });
                return;
            }

            if (!data || data.length === 0) {
                res.status(404).send({ error: 'Нет данных для экспорта по указанным фильтрам' });
                return;
            }

            // Форматирование и отправка данных
            const filenameBase = filter_process_id ? `reports_${filter_process_id}` : 'reports'; // Используем ID в имени файла, если он есть

            if (format === 'csv') {
                const simplifiedData = data.map(item => ({
                    ...item,
                    emails_errorMessages: JSON.stringify(item.emails_errorMessages)
                }));
                const csvData = Papa.unparse(simplifiedData, { delimiter: ";" });
                const filename = `${filenameBase}.csv`;
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
                const BOM = '\uFEFF';
                res.status(200).send(BOM + csvData);

            } else if (format === 'json') {
                const filename = `${filenameBase}.json`;
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
                res.status(200).send(JSON.stringify(data, null, 2));

            } else {
                res.status(400).send({ error: 'Неподдерживаемый формат экспорта. Используйте "csv" или "json".' });
            }
        } catch (err) {
            console.error('Ошибка при экспорте отчетов:', err);
            const errorMessage = err instanceof Error ? err.message : 'Внутренняя ошибка сервера';
            res.status(500).send({ error: errorMessage });
        }
    }
}
export const reportsController = new ReportsController();
