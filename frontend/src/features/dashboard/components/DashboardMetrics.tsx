import React from 'react';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';

export const DashboardMetrics: React.FC = () => {
  const { data, isLoading, error } = useDashboardMetrics();

  if (isLoading) {
    return <div className="loading">Загрузка метрик...</div>;
  }

  if (error) {
    return <div className="error">Ошибка загрузки метрик: {error.message}</div>;
  }

  if (!data) {
    return <div className="empty-state">Нет доступных метрик.</div>;
  }

  const { accountsStats } = data;

  return (
    <div className="dashboard-metrics">




      <div className="accounts-stats">
        <h2 className="text-xl font-semibold mb-4">Статистика по аккаунтам</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">Аккаунт</th>
                <th className="py-3 px-4 text-right">Всего</th>
                <th className="py-3 px-4 text-right">Успешно</th>
                <th className="py-3 px-4 text-right">Ошибка</th>
                <th className="py-3 px-4 text-right">Частично</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(accountsStats).map(([account, stats]) => (
                <tr key={account} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4">{account}</td>
                  <td className="py-3 px-4 text-right">{stats.total}</td>
                  <td className="py-3 px-4 text-right text-green-600">{stats.success}</td>
                  <td className="py-3 px-4 text-right text-red-600">{stats.failure}</td>
                  <td className="py-3 px-4 text-right text-yellow-600">{stats.partial}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
