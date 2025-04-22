import { Request, Response } from 'express';
import { supabaseClient } from '../clients/supabaseClient';


class ReportsController {
    public async getReports(_req: Request, response: Response) {
        const { data, error } = await supabaseClient.from('reports').select();

        if (error) {
            console.error('Ошибка Supabase:', error);
            response.status(500).send({ error: 'Ошибка при получении отчетов' });
        }

        if (!data) {
            response.status(500).send({ error: 'Данные не получены' });
            return;
        }

        const grouped: Record<string, typeof data> = data.reduce((acc, item) => {
            const processId = item.process_id || '1';
            if (!acc[processId]) {
                acc[processId] = [];
            }
            acc[processId].push(item);
            return acc;
        }, {} as Record<string, typeof data>);

        response.status(200).send(grouped);
    }
}
export const reportsController = new ReportsController();
