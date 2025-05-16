import React from 'react';
import { Report } from '../../../types/types';
import { formatDate } from '../../../shared/utils/formatters';
import { StatusBadge } from '../../../shared/utils/uiHelpers';

interface ReportRowItemProps {
  report: Report;
  onClick?: (report: Report) => void;
}

export const ReportRowItem: React.FC<ReportRowItemProps> = ({ report, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(report);
    }
  };

  return (
    <tr
      key={report.id}
      className="divide-x divide-gray-200 transition duration-300 ease hover:bg-blue-100 *:px-4 *:py-2 *:whitespace-nowrap *:text-sm cursor-pointer"
      onClick={handleClick}
    >
      <td className="font-medium text-gray-900">{report.account}</td>
      <td className="text-gray-500">{report.sender}</td>
      <td className="text-gray-500">{report.inbox}</td>
      <td className="">
        <StatusBadge status={report.status} />
      </td>
      <td className="text-gray-500 text-center">{report.emails_found ?? 0}/{report.emails_processed ?? 0}</td>
      <td className="text-gray-500 text-center">{report.replies_Sent}</td>
      <td className="text-gray-500">{formatDate(report.created_at)}</td>
      <td className="text-gray-500">
        {report.links_attemptedOpen ?? 0}/{report.links_found ?? 0}
        {report.links_errors != null && report.links_errors > 0 && (
          <span className="text-red-600 ml-1 font-medium">({report.links_errors} ош)</span>
        )}
      </td>
      <td className="text-gray-500 text-center">{report.spam_found ?? 0}</td>
      <td className="text-gray-500 text-center">{report.spam_moved ?? 0}</td>
    </tr>
  );
};
