import { FC, Fragment } from 'react';
import { LogEntry } from '../hooks/useLogStream';

interface LogRowProps {
  logEntry: LogEntry;
  logKey: string | number;
}

export const LogRow: FC<LogRowProps> = ({ logEntry, logKey }) => {
  if (!logEntry) return null;

  const getLogColor = (level: LogEntry['level']): string => {
    switch (level) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'debug': return 'text-gray-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <div key={logKey} className={`flex items-start px-2 py-0.5 ${getLogColor(logEntry.level)}`}>
      <span className="text-gray-400 mr-2 w-20 flex-shrink-0 pt-px">
        {new Date(logEntry.timestamp).toLocaleTimeString()}
      </span>
      <span className={`font-bold mr-1 w-16 flex-shrink-0 pt-px ${getLogColor(logEntry.level)}`}>
        [{logEntry.level.toUpperCase()}]:
      </span>
      <span className="flex-grow min-w-0 pt-px">
        {logEntry.message.map((msgPart, i) => (
          <Fragment key={i}>
            <span className="break-all whitespace-pre-wrap">
              {typeof msgPart === 'object' ? JSON.stringify(msgPart) : String(msgPart)}
            </span>
            {' '}
          </Fragment>
        ))}
      </span>
    </div>
  );
};
