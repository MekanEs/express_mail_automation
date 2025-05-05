import React from 'react';
import { Report, ReportGroup } from '../../types/types';
import { formatDate } from '../../utils/formatters';
import { StatusBadge } from '../../utils/uiHelpers';
import { UseMutateFunction } from '@tanstack/react-query';
import { DeleteReportsParams } from '../../api/reportsApi';

interface ReportsTableProps {
    reportGroups: ReportGroup[];
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    onSortChange: (newSortBy: string) => void;
    deleteReports: UseMutateFunction<void, Error, DeleteReportsParams, unknown>
    isDeleting: boolean;
}

export const ReportsTable: React.FC<ReportsTableProps> = ({
    reportGroups,
    sortBy,
    sortOrder,
    onSortChange,
    deleteReports,
    isDeleting,
}) => {

    // Функция для рендеринга иконки сортировки
    const renderSortArrow = (columnName: string) => {
        if (sortBy === columnName) {
            return sortOrder === 'asc' ? ' ▲' : ' ▼';
        }
        return '';
    };

    return (
        <div className="space-y-6">
            {reportGroups.map(({ processId, reports }: ReportGroup) => (
                <div key={processId} className="bg-white rounded-lg p-4 shadow-md">
                    {/* Заголовок группы */}
                    <div className="flex justify-between items-center mb-3 border-b pb-2">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                                Process ID:
                                <span className=" ml-2 font-mono">
                                    {processId}
                                </span>
                            </h3>
                            {reports.length > 0 && (
                                <p className="text-sm text-gray-500">
                                    Latest activity: {formatDate(reports[0]?.created_at)}
                                </p>
                            )}
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {reports.length} report(s) in this group
                        </span>
                    </div>

                    {/* Таблица для группы */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-100">
                            {reports.length > 0 ? (
                                <thead className="bg-gray-50">
                                    <tr className='divide-x divide-gray-100 *:px-4 *:py-3 *:text-left *:text-xs *:font-medium *:text-gray-500 *:uppercase *:tracking-wider *:cursor-pointer'>
                                        <th scope="col" onClick={() => onSortChange('account')}>Account{renderSortArrow('account')}</th>
                                        <th scope="col" onClick={() => onSortChange('sender')}>Sender{renderSortArrow('sender')}</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inbox</th>
                                        <th scope="col" onClick={() => onSortChange('status')}>Status{renderSortArrow('status')}</th>
                                        <th scope="col" onClick={() => onSortChange('emails_found')}>Found/Processed{renderSortArrow('emails_found')}</th>
                                        <th scope="col" >Replies Sent</th>
                                        <th scope="col" onClick={() => onSortChange('created_at')}>Date{renderSortArrow('created_at')}</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Links Opened</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spam Found</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spam Moved</th>
                                    </tr>
                                </thead>) : ''}
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reports.length > 0 ? (
                                    reports.map((item: Report) => (
                                        <tr key={item.id} className="divide-x divide-gray-200 transition duration-300 ease hover:bg-blue-100 *:px-4 *:py-2 *:whitespace-nowrap *:text-sm">
                                            <td className=" font-medium text-gray-900">{item.account}</td>
                                            <td className="text-gray-500">{item.sender}</td>
                                            <td className="text-gray-500">{item.inbox}</td>
                                            <td className="">
                                                <StatusBadge status={item.status} />
                                            </td>
                                            <td className="text-gray-500 text-center">{item.emails_found ?? 0}/{item.emails_processed ?? 0}</td>
                                            <td className="text-gray-500 text-center">{item.replies_Sent}</td>
                                            <td className="text-gray-500">{formatDate(item.created_at)}</td>
                                            <td className="text-gray-500">
                                                {item.links_attemptedOpen ?? 0}/{item.links_found ?? 0}
                                                {item.links_errors != null && item.links_errors > 0 && (
                                                    <span className="text-red-600 ml-1 font-medium">({item.links_errors} err)</span>
                                                )}
                                            </td>
                                            <td className="text-gray-500 text-center">{item.spam_found ?? 0}</td>
                                            <td className="text-gray-500 text-center">{item.spam_moved ?? 0}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">No reports found for this process ID with current filters.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end mt-2">
                        <button
                            disabled={isDeleting}
                            onClick={() => {
                                if (window.confirm('удалить отчет?')) {
                                    deleteReports({ process_id: processId })
                                }
                            }}
                            className="btn btn-danger w-[200px]"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
