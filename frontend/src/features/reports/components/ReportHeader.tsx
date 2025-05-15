import { FC } from 'react';

interface ReportHeaderProps {
  onlyFound: boolean;
  isFetching: boolean;
  onToggleFilter: () => void;
  onRefresh: () => void;
}

export const ReportHeader: FC<ReportHeaderProps> = ({
  onlyFound,
  isFetching,
  onToggleFilter,
  onRefresh
}) => {
  return (
    <div className="card-header flex justify-between items-center">
      <h2 className="text-xl font-semibold text-text-primary">Reports</h2>
      <div className="flex space-x-2">
        <button
          onClick={onToggleFilter}
          className="btn btn-secondary"
        >
          {onlyFound ? 'All Reports' : 'Only with Found Emails'}
        </button>
        <button
          onClick={onRefresh}
          className="btn"
        >
          {isFetching ? 'Refreshing...' : 'Refresh Reports'}
        </button>
      </div>
    </div>
  );
};
