import React from 'react';
import { useDashboardMetrics } from '../../hooks/useDashboardQueries';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';

export const DashboardPage: React.FC = () => {
    const { data: metrics, isLoading, isError, error } = useDashboardMetrics();

    if (isLoading) {
        return <div className="text-center p-4">Loading dashboard metrics...</div>;
    }

    if (isError) {
        return <div className="text-center p-4 text-red-600">Error loading dashboard metrics: {error?.message}</div>;
    }

    if (!metrics) {
        return <div className="text-center p-4">No dashboard metrics available.</div>;
    }

    const { summary, recentProcesses, accountsStats } = metrics;

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-semibold">Dashboard</h2>

            {/* --- Сводная статистика --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white shadow rounded-lg p-5 text-center">
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Reports</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{summary?.totalReports ?? 'N/A'}</dd>
                </div>
                 <div className="bg-white shadow rounded-lg p-5 text-center">
                    <dt className="text-sm font-medium text-gray-500 truncate">Emails Found</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{summary?.totalEmailsFound ?? 'N/A'}</dd>
                </div>
                 <div className="bg-white shadow rounded-lg p-5 text-center">
                    <dt className="text-sm font-medium text-gray-500 truncate">Emails Processed</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{summary?.totalEmailsProcessed ?? 'N/A'}</dd>
                </div>
                <div className="bg-white shadow rounded-lg p-5 text-center">
                    <dt className="text-sm font-medium text-gray-500 truncate">Success Rate</dt>
                    <dd className="mt-1 text-3xl font-semibold text-green-600">{summary?.successRate !== undefined ? `${summary.successRate}%` : 'N/A'}</dd>
                </div>
            </div>

            {/* --- Недавние процессы и Статистика по аккаунтам --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Недавние процессы */}
                <div className="bg-white shadow rounded-lg">
                    <h3 className="text-lg font-medium p-4 border-b">Recent Processes</h3>
                    {recentProcesses && recentProcesses.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {recentProcesses.map(proc => (
                                <li key={proc.process_id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                                    <Link to={`/process/${proc.process_id}`} className="text-indigo-600 hover:underline font-mono text-sm">
                                        {proc.process_id}
                                    </Link>
                                    <span className="text-sm text-gray-500">{formatDate(proc.created_at)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="p-4 text-center text-gray-500">No recent processes found.</p>
                    )}
                </div>

                {/* Статистика по аккаунтам */}
                <div className="bg-white shadow rounded-lg">
                    <h3 className="text-lg font-medium p-4 border-b">Account Stats</h3>
                     {accountsStats && Object.keys(accountsStats).length > 0 ? (
                         <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Success</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Partial</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Failed</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {Object.entries(accountsStats).map(([account, stats]) => (
                                        <tr key={account} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{account}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{stats.total}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-center">{stats.success}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 text-center">{stats.partial}</td>{/* Используем partial */} 
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-center">{stats.failure}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     ) : (
                         <p className="p-4 text-center text-gray-500">No account statistics available.</p>
                     )}
                </div>
            </div>
        </div>
    );
}; 