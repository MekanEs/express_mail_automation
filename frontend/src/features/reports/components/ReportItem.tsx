import { FC } from 'react';
import { Report } from '../../../types/types';

interface ReportItemProps {
  item: Report;
}

export const ReportItem: FC<ReportItemProps> = ({ item }) => {
  return (
    <tr key={item.id}>
      <td className="font-medium">{item.account}</td>
      <td>{item.sender}</td>
      <td>{item.inbox}</td>
      <td>
        <span
          className={`px-2 py-1 rounded-full text-xs ${item.status === 'success'
            ? 'bg-green-100 text-green-800'
            : item.status === 'partial_failure' || item.status === 'failure'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
            }`}
        >
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
  );
};
