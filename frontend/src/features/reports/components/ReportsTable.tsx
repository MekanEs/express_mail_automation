import React, { useState } from 'react';
import { Report, ReportGroup } from '../../../types/types';
import { formatDate } from '../../../shared/utils/formatters';
import { UseMutateFunction } from '@tanstack/react-query';
import { DeleteReportsParams } from '../api';
import { ReportRowItem } from './ReportRowItem';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { ReportDetailModal } from './ReportDetailModal';
import { ProcessReport } from '../../../types/reports';

// Dummy IconChevron component for now
const IconChevron: React.FC<{ direction: 'up' | 'down'; className?: string }> = ({ direction, className }) => (
    <span className={`inline-block transform ${direction === 'up' ? '-rotate-180' : ''} ${className}`}>
        ▼
    </span>
);

interface ReportsTableProps {
    reportGroups: ReportGroup[];
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    onSortChange: (newSortBy: string) => void;
    deleteReports: UseMutateFunction<void, Error, DeleteReportsParams, unknown>;
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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [processIdToDelete, setProcessIdToDelete] = useState<string | null>(null);
    const [selectedReport, setSelectedReport] = useState<ProcessReport | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]); // State for expanded groups

    const toggleGroupExpansion = (processId: string) => {
        setExpandedGroups(prev =>
            prev.includes(processId)
                ? prev.filter(id => id !== processId)
                : [...prev, processId]
        );
    };

    const isGroupExpanded = (processId: string) => expandedGroups.includes(processId);

    const renderSortArrow = (columnName: string) => {
        if (sortBy === columnName) {
            return sortOrder === 'asc' ? ' ▲' : ' ▼';
        }
        return '';
    };

    const handleConfirmDelete = () => {
        if (processIdToDelete) {
            deleteReports({ process_id: processIdToDelete });
            setProcessIdToDelete(null);
            setShowDeleteConfirm(false);
        }
    };

    const handleCancelDelete = () => {
        setProcessIdToDelete(null);
        setShowDeleteConfirm(false);
    };

    const handleDeleteClick = (processId: string) => {
        setProcessIdToDelete(processId);
        setShowDeleteConfirm(true);
    };

    const handleRowClick = (report: Report) => {
        const processReport: ProcessReport = {
            process_id: report.process_id || '',
            status: report.status as 'success' | 'partial_failure' | 'failure',
            account: report.account || '',
            sender: report.sender || '',
            replies_sent: report.replies_Sent || 0,
            spam: {
                found: report.spam_found || 0,
                moved: report.spam_moved || 0
            },
            emails: {
                found: report.emails_found || 0,
                processed: report.emails_processed || 0,
                errors: report.emails_errors || 0,
                errorMessages: Array.isArray(report.emails_errorMessages)
                    ? report.emails_errorMessages.map(msg => String(msg))
                    : []
            },
            links: {
                found: report.links_found || 0,
                targetOpen: report.links_targetOpen || 0,
                attemptedOpen: report.links_attemptedOpen || 0,
                errors: report.links_errors || 0,
                errorMessages: Array.isArray(report.links_errorMessages)
                    ? report.links_errorMessages.map(msg => String(msg))
                    : []
            }
        };
        setSelectedReport(processReport);
        setShowDetailModal(true);
    };

    return (
        <>
            <div className="space-y-6">
                {reportGroups.map(({ processId, reports }: ReportGroup) => {
                    // Calculate summary statistics for the group
                    const totalEmailsFound = reports.reduce((sum, r) => sum + (r.emails_found || 0), 0);
                    const totalEmailsProcessed = reports.reduce((sum, r) => sum + (r.emails_processed || 0), 0);
                    const totalLinksOpened = reports.reduce((sum, r) => sum + (r.links_targetOpen || 0), 0);
                    const totalLinksAttempted = reports.reduce((sum, r) => sum + (r.links_attemptedOpen || 0), 0);
                    const totalLinkErrors = reports.reduce((sum, r) => sum + (r.links_errors || 0), 0);
                    const totalRepliesSent = reports.reduce((sum, r) => sum + (r.replies_Sent || 0), 0);
                    const hasErrorsInGroup = reports.some(r => r.status === 'failure' || r.status === 'partial_failure');

                    return (
                        <div key={processId} className="report-group-card bg-white rounded-xl p-4 shadow-lg mb-6 transition-all hover:shadow-xl">
                            <div
                                className="card-header flex justify-between items-center cursor-pointer mb-3 border-b pb-3"
                                onClick={() => toggleGroupExpansion(processId)}
                            >
                                <div>
                                    <h3 className="text-xl font-semibold text-indigo-700">
                                        ID Процесса: <span className="font-mono text-indigo-600">{processId}</span>
                                        {hasErrorsInGroup && <span className="ml-2 text-xs text-red-500 font-semibold">(Есть ошибки)</span>}
                                    </h3>
                                    {reports.length > 0 && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            Последняя активность: {formatDate(reports[0]?.created_at)}
                                        </p>
                                    )}
                                    {/* Display summary stats */}
                                    <div className="mt-2 text-xs text-gray-600 flex flex-wrap gap-x-3 gap-y-1">
                                        <span>Обработано: <span className="font-semibold">{totalEmailsProcessed}</span>/<span className="font-semibold">{totalEmailsFound}</span></span>
                                        <span>Ответов: <span className="font-semibold">{totalRepliesSent}</span></span>
                                        <span>Ссылок (попыток/открыто/ошибок): <span className="font-semibold">{totalLinksAttempted}/{totalLinksOpened}/<span className='text-red-500'>{totalLinkErrors}</span></span></span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className="badge badge-lg badge-neutral">{reports.length} отчет(ов)</span>
                                    <IconChevron direction={isGroupExpanded(processId) ? 'up' : 'down'} className="text-gray-500 w-5 h-5" />
                                </div>
                            </div>

                            {isGroupExpanded(processId) && (
                                <div className="card-body overflow-x-auto overflow-y-auto max-h-[500px] relative">
                                    {reports.length > 0 ? (
                                        <table className="min-w-full divide-y divide-gray-200 border border-gray-100">
                                            <thead className="bg-gray-50 sticky top-0 z-10">
                                                <tr className='divide-x divide-gray-100 *:px-3 *:py-2 *:text-left *:text-xs *:font-medium *:text-gray-500 *:uppercase *:tracking-wider *:cursor-pointer'>
                                                    <th scope="col" onClick={() => onSortChange('account')}>Аккаунт{renderSortArrow('account')}</th>
                                                    <th scope="col" onClick={() => onSortChange('sender')}>Отправитель{renderSortArrow('sender')}</th>
                                                    <th scope="col">Входящие</th>
                                                    <th scope="col" onClick={() => onSortChange('status')}>Статус{renderSortArrow('status')}</th>
                                                    <th scope="col" onClick={() => onSortChange('emails_found')}>Найдено/Обработано{renderSortArrow('emails_found')}</th>
                                                    <th scope="col">Отправлено ответов</th>
                                                    <th scope="col" onClick={() => onSortChange('created_at')}>Дата{renderSortArrow('created_at')}</th>
                                                    <th scope="col">Попыток/Открыто-ссылок</th>
                                                    <th scope="col">Найдено спама</th>
                                                    <th scope="col">Перемещено спама</th>
                                                    {/* Consider adding a details button/column here if row click for details is removed */}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {reports.map((report: Report) => (
                                                    <ReportRowItem
                                                        key={report.id}
                                                        report={report}
                                                        onClick={handleRowClick} // Row click still opens detail modal
                                                    />
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p className="text-center text-sm text-gray-500 py-4">Отчеты для этого ID процесса с текущими фильтрами не найдены.</p>
                                    )}
                                </div>
                            )}
                            <div className="flex justify-end mt-3 border-t pt-3">
                                <button
                                    disabled={isDeleting}
                                    onClick={() => handleDeleteClick(processId)}
                                    className="btn btn-sm btn-error flex items-center justify-center"
                                >
                                    {isDeleting && <span className="spinner-sm mr-2"></span>}
                                    {isDeleting ? 'Удаление группы...' : 'Удалить группу отчетов'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <ConfirmModal
                isOpen={showDeleteConfirm}
                title="Удалить группу отчетов"
                message={`Вы уверены, что хотите удалить все отчеты для ID процесса: ${processIdToDelete}? Это действие нельзя будет отменить.`}
                confirmText="Удалить"
                cancelText="Отмена"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                isConfirmLoading={isDeleting}
            />

            <ReportDetailModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                report={selectedReport}
            />
        </>
    );
};
