import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Database } from '../../types/database.types';
import { BASE_API } from '../../shared/api/constants';
import { useArchiveSenderAggregates } from '../../features/reports/hooks/useReportMutations';

// Define the type based on sender_aggregates.Row
type SenderAggregateRow = Database['public']['Tables']['sender_aggregates']['Row'];
type SenderAggregateArchiveRow = Database['public']['Tables']['sender_aggregates_archive']['Row'];

// --- API Function ---
const API_URL = BASE_API; // Assuming same base URL as reportsApi

const getSenderAggregates = async (): Promise<SenderAggregateRow[]> => {
    const url = `${API_URL}/reports/sender-aggregates`; // Hypothetical endpoint
    const response = await fetch(url);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch sender aggregates: ${response.statusText}`);
    }
    const data = await response.json();
    // Assuming the API returns an object with a data property containing the array
    return data.data || data;
};

const getSenderAggregatesArchive = async (): Promise<SenderAggregateArchiveRow[]> => {
    const url = `${API_URL}/reports/sender-aggregates-archive`; // Hypothetical endpoint
    const response = await fetch(url);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch sender aggregates: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data || data;
};

// --- useQuery Hook ---
const useSenderAggregates = () => {
    return useQuery<SenderAggregateRow[], Error>({
        queryKey: ['senderAggregates'], // Unique query key
        queryFn: getSenderAggregates,
    });
};
const useSenderAggregatesArchive = () => {
    return useQuery<SenderAggregateArchiveRow[], Error>({
        queryKey: ['senderAggregatesArchive'], // Unique query key
        queryFn: getSenderAggregatesArchive,
    });
};
// --- React Component ---
const SenderAggregatesTable: React.FC = () => {
    const { data, isLoading, error } = useSenderAggregates();
    const { data: dataArchive, isLoading: isLoadingArchive, error: errorArchive } = useSenderAggregatesArchive();
    const [showArchive, setShowArchive] = useState(false);

    const { mutate: runArchive, isPending: isArchiving } = useArchiveSenderAggregates();

    if (isLoading) return <div>Loading sender aggregates...</div>;
    if (error) return <div>Error loading sender aggregates: {error.message}</div>;
    if (isLoadingArchive) return <div>Loading sender aggregates archive...</div>;
    if (errorArchive) return <div>Error loading sender aggregates archive: {errorArchive.message}</div>;

    const displayData = showArchive ? dataArchive : data;

    if (!Array.isArray(displayData)) {
        if ((showArchive && !dataArchive) || (!showArchive && !data)) {
            return <div>Data is still loading or not available.</div>;
        }
        console.error("Selected data source is not an array:", displayData);
        return <div>Invalid data received.</div>;
    }

    if (displayData.length === 0) return <div>No data available for the selected source.</div>;

    const handleArchiveClick = () => {
        if (window.confirm('Вы уверены, что хотите скопировать текущие агрегированные данные в архив? Существующие записи в архиве с теми же отправителями будут обновлены.')) {
            runArchive();
        }
    };

    return (
        <div style={{ marginTop: '20px' }}>
            <div className="flex space-x-2 mb-4">
                <button className='btn btn-primary' onClick={() => setShowArchive(!showArchive)}>
                    {showArchive ? "Показать оперативные данные" : "Показать архив"}
                </button>
                <button
                    className='btn'
                    onClick={handleArchiveClick}
                    disabled={isArchiving}
                >
                    {isArchiving ? 'Архивация...' : 'Скопировать в архив'}
                </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #ccc' }}>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Sender</th>
                        <th style={{ textAlign: 'right', padding: '8px' }}>Emails Processed</th>
                        <th style={{ textAlign: 'right', padding: '8px' }}>Links Attempted/Opened</th>
                        <th style={{ textAlign: 'right', padding: '8px' }}>Total Replies Sent</th>
                        <th style={{ textAlign: 'right', padding: '8px' }}>Reports</th>
                        <th style={{ textAlign: 'right', padding: '8px' }}>Spam Found/Moved</th>
                    </tr>
                </thead>
                <tbody>
                    {displayData.map((row) => (
                        <tr key={row.sender} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '8px' }}>{row.sender}</td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>{row.total_emails_processed}</td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>{`${row.total_links_attempted_open}/${row.total_links_opened}`}</td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>{row.total_replies_sent}</td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>{row.total_reports}</td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>{`${row.total_spam_found}/${row.spam_moved}`}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// --- Main Page Component ---
export const DashboardPage: React.FC = () => {
    return (
        <div>
            <h1>Dashboard</h1>
            <SenderAggregatesTable />
        </div>
    );
};
