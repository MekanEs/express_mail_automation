import { FC, MutableRefObject, useRef, RefObject } from 'react';
import { LogEntry } from '../hooks/useLogStream';
import { LogRow } from './LogRow';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

const OVERSCAN_COUNT = 200;

interface LogDisplayProps {
  filteredLogs: LogEntry[];
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  onUserScroll: () => void;
  isFollowing: boolean;
}

export const LogDisplay: FC<LogDisplayProps> = ({
  filteredLogs,
  scrollContainerRef,
  onUserScroll,
  isFollowing
}) => {
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const handleScroll = () => {
    onUserScroll();
  };

  return (
    <div style={{ height: '100%', width: '100%' }} className="flex-grow">
      <Virtuoso
        ref={virtuosoRef}
        scrollerRef={(el) => {
          if (scrollContainerRef && typeof scrollContainerRef === 'object') {
            (scrollContainerRef as MutableRefObject<HTMLDivElement | null>).current = el as HTMLDivElement;
          }
        }}
        data={filteredLogs}
        className="font-mono text-sm bg-gray-950 p-2 w-full h-full overflow-x-hidden"
        onScroll={handleScroll}
        followOutput={isFollowing}
        itemContent={(index, log) => (
          <LogRow
            logEntry={log}
            logKey={`${log.timestamp}-${index}`}
          />
        )}
        overscan={OVERSCAN_COUNT}
        totalCount={filteredLogs.length}
        initialTopMostItemIndex={isFollowing ? filteredLogs.length - 1 : 0}
      />
    </div>
  );
};
