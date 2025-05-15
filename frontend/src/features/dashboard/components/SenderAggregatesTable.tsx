import React from 'react';
import { useSenderAggregates } from '../hooks/useSenderAggregates';
import { SenderAggregateRow } from '../api';

export const SenderAggregatesTable: React.FC = () => {
  const {
    data,
    isLoading,
    error,
    showArchive,
    toggleView,
    handleArchive,
    isArchiving
  } = useSenderAggregates();

  if (isLoading) {
    return <div className="loading">Loading data...</div>;
  }

  if (error) {
    return <div className="error">Error loading data: {error.message}</div>;
  }

  if (!Array.isArray(data) || data.length === 0) {
    return <div className="empty-state">No data available.</div>;
  }

  return (
    <div className="sender-aggregates-table mt-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Sender Statistics</h2>
        <div className="flex space-x-2">
          <button
            className="btn btn-primary"
            onClick={toggleView}
          >
            {showArchive ? "Show Current Data" : "Show Archive"}
          </button>
          <button
            className="btn"
            onClick={handleArchive}
            disabled={isArchiving}
          >
            {isArchiving ? 'Archiving...' : 'Archive Data'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left">Sender</th>
              <th className="py-3 px-4 text-right">Emails Processed</th>
              <th className="py-3 px-4 text-right">Links Attempted/Opened</th>
              <th className="py-3 px-4 text-right">Total Replies Sent</th>
              <th className="py-3 px-4 text-right">Reports</th>
              <th className="py-3 px-4 text-right">Spam Found/Moved</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row: SenderAggregateRow) => (
              <tr key={row.sender} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4">{row.sender}</td>
                <td className="py-3 px-4 text-right">{row.total_emails_processed}</td>
                <td className="py-3 px-4 text-right">{`${row.total_links_attempted_open}/${row.total_links_opened}`}</td>
                <td className="py-3 px-4 text-right">{row.total_replies_sent}</td>
                <td className="py-3 px-4 text-right">{row.total_reports}</td>
                <td className="py-3 px-4 text-right">{`${row.total_spam_found}/${row.spam_moved}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
