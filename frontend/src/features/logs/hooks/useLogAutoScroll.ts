import { useState, useEffect, useCallback, MutableRefObject } from 'react';
import { LogEntry } from './useLogStream';

interface UseLogAutoScrollParams {
  logsContainerRef: MutableRefObject<HTMLDivElement>;
  filteredLogs: LogEntry[];
}

export const useLogAutoScroll = ({ logsContainerRef, filteredLogs }: UseLogAutoScrollParams) => {
  const [isPaused, setIsPaused] = useState(false);

  // Auto-scroll to bottom when filtered logs change
  useEffect(() => {
    if (!isPaused && logsContainerRef.current) {
      const { scrollHeight, clientHeight } = logsContainerRef.current;
      logsContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  }, [filteredLogs, isPaused, logsContainerRef]);

  // Handler for user scroll action
  const handleUserScroll = useCallback(() => {
    if (logsContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
      // If user scrolled up from the bottom, pause auto-scrolling
      // Allow a small tolerance to avoid false positives
      if (scrollHeight - scrollTop - clientHeight > 20) {
        if (!isPaused) setIsPaused(true);
      } else {
        // Optionally, if user scrolled to bottom, we could unpause
        // if (isPaused) setIsPaused(false);
      }
    }
  }, [isPaused, logsContainerRef]);

  // Toggle pause/follow state manually
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return {
    isPaused,
    handleUserScroll,
    togglePause
  };
};
