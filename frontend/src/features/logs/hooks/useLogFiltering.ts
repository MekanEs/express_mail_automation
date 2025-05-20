import { useState, useMemo } from 'react';
import { LogEntry } from './useLogStream';

interface UseLogFilteringParams {
  allLogs: LogEntry[];
}

export const useLogFiltering = ({ allLogs }: UseLogFilteringParams) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLevels, setSelectedLevels] = useState<Set<LogEntry['level']>>(
    new Set(['info', 'warn', 'error', 'debug'])
  );
  const [isLevelFilterOpen, setIsLevelFilterOpen] = useState(false);

  // Derived state for filtered logs
  const filteredLogs = useMemo(() => {
    let tempFilteredLogs = allLogs;

    // Filter by log level if not all levels are selected
    if (selectedLevels.size < 4) {
      tempFilteredLogs = tempFilteredLogs.filter(log => selectedLevels.has(log.level));
    }

    // Filter by search term if one is provided
    if (searchTerm.trim() !== '') {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tempFilteredLogs = tempFilteredLogs.filter(log =>
        log.message.some(msgPart =>
          String(typeof msgPart === 'object' ? JSON.stringify(msgPart) : msgPart)
            .toLowerCase()
            .includes(lowerSearchTerm)
        ) || log.level.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Limit the number of logs to prevent performance issues
    return tempFilteredLogs
  }, [allLogs, searchTerm, selectedLevels]);

  // Toggle a specific log level in the filter
  const toggleLogLevel = (level: LogEntry['level']) => {
    const newSelectedLevels = new Set(selectedLevels);
    if (newSelectedLevels.has(level)) {
      newSelectedLevels.delete(level);
    } else {
      newSelectedLevels.add(level);
    }
    setSelectedLevels(newSelectedLevels);
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedLevels(new Set(['info', 'warn', 'error', 'debug']));
    setSearchTerm('');
    setIsLevelFilterOpen(false);
  };

  return {
    filteredLogs,
    searchTerm,
    setSearchTerm,
    selectedLevels,
    isLevelFilterOpen,
    setIsLevelFilterOpen,
    toggleLogLevel,
    resetFilters,
  };
};
