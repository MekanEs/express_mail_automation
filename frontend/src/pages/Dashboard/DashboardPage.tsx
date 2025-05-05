import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Database } from '../../types/database.types';
import { BASE_API } from '../../api/constants';

// Define the type based on sender_aggregates.Row
type SenderAggregateRow = Database['public']['Tables']['sender_aggregates']['Row'];

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

// --- useQuery Hook ---
const useSenderAggregates = () => {
    return useQuery<SenderAggregateRow[], Error>({
        queryKey: ['senderAggregates'], // Unique query key
        queryFn: getSenderAggregates,
    });
};

// --- React Component ---
const SenderAggregatesTable: React.FC = () => {
    const { data, isLoading, error } = useSenderAggregates();

    if (isLoading) return <div>Loading sender aggregates...</div>;
    if (error) return <div>Error loading sender aggregates: {error.message}</div>;

    // Add a more robust check to ensure data is an array before mapping
    if (!Array.isArray(data)) {
        console.error("Sender aggregates data is not an array:", data);
        return <div>Invalid data received for sender aggregates.</div>;
    }

    if (data.length === 0) return <div>No sender aggregate data available.</div>;

    return (
        <div style={{ marginTop: '20px' }}>
            <h2>Sender Aggregates</h2>
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
                    {data.map((row) => (
                        <tr key={row.sender} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '8px' }}>{row.sender}</td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>{row.total_emails_processed}</td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>{row.total_links_attempted_open}/{row.total_links_opened}</td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>{row.total_replies_sent}</td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>{row.total_reports}</td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>{row.total_spam_found}/{row.spam_moved}</td>
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
