import React, { useState } from 'react';
import { Report, ReportGroup } from '../../../types/types';
import { formatDate } from '../../../shared/utils/formatters';
import { UseMutateFunction } from '@tanstack/react-query';
import { DeleteReportsParams } from '../api';
import { ReportRowItem } from './ReportRowItem';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { ReportDetailModal } from './ReportDetailModal';
import { ProcessReport } from '../../../types/reports';

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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [processIdToDelete, setProcessIdToDelete] = useState<string | null>(null);
    const [selectedReport, setSelectedReport] = useState<ProcessReport | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Функция для рендеринга иконки сортировки
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
        // Convert the Report to ProcessReport structure for the detail modal
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

    const handleGroupHeaderClick = (_processId: string, reports: Report[]) => {
        if (reports.length === 0) return;

        // Use the first report as a base for group details
        const firstReport = reports[0];
        handleRowClick(firstReport);
    };

    return (
        <>
            <div className="space-y-6">
                {reportGroups.map(({ processId, reports }: ReportGroup) => (
                    <div key={processId} className="bg-white rounded-lg p-4 shadow-md">
                        {/* Заголовок группы - сделан кликабельным */}
                        <div
                            className="flex justify-between items-center mb-3 border-b pb-2 cursor-pointer hover:bg-gray-50"
                            onClick={() => handleGroupHeaderClick(processId, reports)}
                        >
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Process ID:
                                    <span className="ml-2 font-mono">
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
                        <div className="overflow-x-auto overflow-y-auto max-h-[500px] relative">
                            <table className="min-w-full divide-y divide-gray-200 border border-gray-100">
                                {reports.length > 0 ? (
                                    <thead className="bg-gray-50 sticky top-0 z-10">
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
                                        reports.map((report: Report) => (
                                            <ReportRowItem
                                                key={report.id}
                                                report={report}
                                                onClick={handleRowClick}
                                            />
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
                                onClick={() => handleDeleteClick(processId)}
                                className="btn btn-danger flex items-center justify-center px-4 py-2"
                            >
                                {isDeleting && <span className="spinner-sm mr-2"></span>}
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                title="Delete Report Group"
                message="Are you sure you want to delete this report group? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                isConfirmLoading={isDeleting}
            />

            {/* Report Detail Modal */}
            <ReportDetailModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                report={selectedReport}
            />
        </>
    );
};
