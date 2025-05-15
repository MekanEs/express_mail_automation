import { FC, MutableRefObject } from 'react';
import { LogEntry } from '../hooks/useLogStream';
import { LogRow } from './LogRow';

interface LogDisplayProps {
  filteredLogs: LogEntry[];
  logsContainerRef: MutableRefObject<HTMLDivElement>;
  onUserScroll: () => void;
}

export const LogDisplay: FC<LogDisplayProps> = ({
  filteredLogs,
  logsContainerRef,
  onUserScroll
}) => {
  return (
    <div
      ref={logsContainerRef}
      className="flex-grow overflow-y-auto font-mono text-sm bg-gray-950 p-2"
      onScroll={onUserScroll}
    >
      {filteredLogs.map((log, index) => (
        <LogRow
          key={`${log.timestamp}-${index}`}
          logEntry={log}
          logKey={`${log.timestamp}-${index}`}
        />
      ))}
    </div>
  );
};
