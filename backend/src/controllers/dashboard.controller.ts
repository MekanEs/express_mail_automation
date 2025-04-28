import { Request, Response } from 'express';
import { supabaseClient } from '../clients/supabaseClient';
import { DashboardMetrics } from '../types/types'; // Импортируем нужные типы

class DashboardController {
  public async getDashboardMetrics(_req: Request, res: Response): Promise<void> {
    try {
      // 1. Общая статистика по отчетам
      // Используем rpc для вызова функции БД (если есть) или делаем несколько запросов
      // Пример с несколькими запросами:
      const { data: reportStats, error: reportError } = await supabaseClient
        .from('reports')
        .select('status, emails_found, emails_processed, account, process_id, created_at');

      if (reportError) throw reportError;

      if (!reportStats) {
        res.status(200).send({
          summary: {
            totalReports: 0,
            totalEmailsFound: 0,
            totalEmailsProcessed: 0,
            successRate: 0
          },
          recentProcesses: [],
          accountsStats: {}
        });
        return;
      }

      // Обработка и форматирование данных для дашборда
      const totalReports = reportStats.length;
      const totalEmailsFound = reportStats.reduce((sum, item) => sum + (item.emails_found || 0), 0);
      const totalEmailsProcessed = reportStats.reduce(
        (sum, item) => sum + (item.emails_processed || 0),
        0
      );
      const successfulReports = reportStats.filter((item) => item.status === 'success').length;
      const successRate = totalReports > 0 ? (successfulReports / totalReports) * 100 : 0;

      // Группировка по аккаунтам
      const accountsData: Record<
        string,
        { total: number; success: number; failure: number; partial: number }
      > = {};
      reportStats.forEach((item) => {
        const accountEmail = item.account || 'unknown';
        if (!accountsData[accountEmail]) {
          accountsData[accountEmail] = { total: 0, success: 0, failure: 0, partial: 0 };
        }
        accountsData[accountEmail].total += 1;
        if (item.status === 'success') accountsData[accountEmail].success += 1;
        if (item.status === 'failure') accountsData[accountEmail].failure += 1;
        if (item.status === 'partial_failure') accountsData[accountEmail].partial += 1;
      });

      // Получение последних уникальных process_id, отфильтровав null значения
      const uniqueProcessIds = [
        ...new Map(reportStats.map((item) => [item.process_id, item])).values()
      ]
        // Фильтруем записи, где process_id или created_at равны null
        .filter((item) => item.process_id !== null && item.created_at !== null)
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
        .slice(0, 10)
        // Теперь process_id и created_at гарантированно не null
        .map((item) => ({
          process_id: item.process_id as string,
          created_at: item.created_at as string
        }));

      // Формирование и отправка ответа
      const dashboardData: DashboardMetrics = {
        summary: {
          totalReports,
          totalEmailsFound,
          totalEmailsProcessed,
          successRate: Math.round(successRate * 100) / 100
        },
        recentProcesses: uniqueProcessIds,
        accountsStats: accountsData
      };

      res.status(200).send(dashboardData);
    } catch (err) {
      console.error('Ошибка при получении метрик для дашборда:', err);
      const errorMessage = err instanceof Error ? err.message : 'Внутренняя ошибка сервера';
      res.status(500).send({ error: errorMessage });
    }
  }
}

export const dashboardController = new DashboardController();
