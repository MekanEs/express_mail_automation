import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Report, } from "../../types/types";
import { getReports } from "../../features/reports/api";
import { useDeleteReports } from "../../features/reports/hooks/useReportMutations";

export const Reports = () => {
  const { data: groupedReports = {} as Record<string, Report[]>, isFetching, refetch } = useQuery<Record<string, Report[]>, Error, Record<string, Report[]>>({
    queryKey: ['reports'],
    queryFn: async () => {
      const response = await getReports();
      return response.data.reduce((acc: Record<string, Report[]>, group) => {
        if (!acc[group.processId]) {
          acc[group.processId] = [];
        }
        acc[group.processId].push(...group.reports);
        return acc;
      }, {} as Record<string, Report[]>);
    }
  });
  const { deleteReports, isDeleting } = useDeleteReports();
  const [onlyFound, setOnlyFound] = useState(true);

  const hasReports = groupedReports && Object.keys(groupedReports).length > 0;

  const filteredReportEntries = useMemo(() => {
    return Object.entries(groupedReports)
      .map(([processId, items]: [string, Report[]]): [string, Report[]] => {
        const filteredItems = onlyFound
          ? items.filter(item => item.emails_found != null && item.emails_found > 0)
          : items;
        return [processId, filteredItems];
      })
      .filter(([, filteredItems]: [string, Report[]]) => filteredItems.length > 0);
  }, [groupedReports, onlyFound]);

  return (
    <div className="card-content">
      <div className="card-header flex justify-between items-center">
        <h2 className="text-xl font-semibold text-text-primary">Reports</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setOnlyFound(prev => !prev)}
            className="btn btn-secondary"
          >
            {onlyFound ? 'All Reports' : 'Only with Found Emails'}
          </button>
          <button
            onClick={() => refetch()}
            className="btn"
          >
            {isFetching ? 'Refreshing...' : 'Refresh Reports'}
          </button>
        </div>
      </div>

      {isFetching ? (
        <div className="loading">Loading reports...</div>
      ) : !hasReports ? (
        <div className="empty-state">
          <p>No reports found</p>
          <p className="text-sm">Process some emails to generate reports</p>
        </div>
      ) : filteredReportEntries.length === 0 ? (
        <div className="empty-state">
          <p>No reports found {onlyFound ? 'with emails_found > 0' : ''}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredReportEntries.map(([processId, items]) => (
            <div key={processId} className="bg-gray-50 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <div>

                  <h3 className="text-lg font-medium text-text-primary">
                    {items[0]?.created_at
                      ? new Date(items[0].created_at).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                      : ''}
                  </h3>
                </div>
                <span className="px-3 py-1 bg-primary-light text-white rounded-full text-xs">
                  {items.length} rows
                </span>
              </div>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Sender</th>
                      <th>Inbox</th>
                      <th>Status</th>
                      <th>Found</th>
                      <th>Processed</th>
                      <th>Links</th>
                      <th>Spam Found</th>
                      <th>Spam Moved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: Report) => (
                      <tr key={item.id}>
                        <td className="font-medium">{item.account}</td>
                        <td>{item.sender}</td>
                        <td>{item.inbox}</td>
                        <td>
                          <span className={`px-2 py-1 rounded-full text-xs ${item.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'partial_failure' || item.status === 'failure'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {item.status}
                          </span>
                        </td>
                        <td>{item.emails_found}</td>
                        <td>{item.emails_processed}</td>
                        <td>
                          {item.links_attemptedOpen ?? 0}/{item.links_found ?? 0}
                          {item.links_errors != null && item.links_errors > 0 && (
                            <span className="text-red-500 ml-1">({item.links_errors})</span>
                          )}
                        </td>
                        <td>{item.spam_found}</td>
                        <td>{item.spam_moved}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                disabled={isDeleting}
                onClick={() => deleteReports({ process_id: processId })}
                className="btn btn-danger"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
