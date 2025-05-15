import React from 'react';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';

export const DashboardMetrics: React.FC = () => {
  const { data, isLoading, error } = useDashboardMetrics();

  if (isLoading) {
    return <div className="loading">Loading metrics...</div>;
  }

  if (error) {
    return <div className="error">Error loading metrics: {error.message}</div>;
  }

  if (!data) {
    return <div className="empty-state">No metrics available.</div>;
  }

  const { summary, recentProcesses, accountsStats } = data;

  return (
    <div className="dashboard-metrics">
      <div className="metrics-summary grid grid-cols-4 gap-4 mb-6">
        <div className="metric-card bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Reports</h3>
          <p className="text-2xl font-bold mt-1">{summary.totalReports}</p>
        </div>
        <div className="metric-card bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Emails Found</h3>
          <p className="text-2xl font-bold mt-1">{summary.totalEmailsFound}</p>
        </div>
        <div className="metric-card bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Emails Processed</h3>
          <p className="text-2xl font-bold mt-1">{summary.totalEmailsProcessed}</p>
        </div>
        <div className="metric-card bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Success Rate</h3>
          <p className="text-2xl font-bold mt-1">{summary.successRate}%</p>
        </div>
      </div>

      <div className="recent-processes mb-6">
        <h2 className="text-xl font-semibold mb-4">Recent Processes</h2>
        {recentProcesses.length > 0 ? (
          <ul className="bg-white rounded-lg shadow overflow-hidden">
            {recentProcesses.map((process) => (
              <li key={process.process_id} className="p-4 border-b last:border-b-0">
                <div className="flex justify-between">
                  <span className="font-medium">{process.process_id}</span>
                  <span className="text-gray-500">
                    {new Date(process.created_at).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No recent processes</p>
        )}
      </div>

      <div className="accounts-stats">
        <h2 className="text-xl font-semibold mb-4">Accounts Statistics</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">Account</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Success</th>
                <th className="py-3 px-4 text-right">Failure</th>
                <th className="py-3 px-4 text-right">Partial</th>
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
