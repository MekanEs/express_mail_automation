import { FC, useRef, useEffect } from 'react';
import { useLogStream } from '../hooks/useLogStream';
import { useLogFiltering } from '../hooks/useLogFiltering';
import { useLogAutoScroll } from '../hooks/useLogAutoScroll';
import { LogToolbar } from './LogToolbar';
import { ActiveFilters } from './ActiveFilters';
import { LogDisplay } from './LogDisplay';

/**
 * Main component for viewing application logs
 * Implements a log viewer with streaming, filtering, and auto-scrolling capabilities
 */
const LogsViewer: FC = () => {
  // Refs for DOM elements with explicit null initial value to fix typing issues
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const levelFilterRef = useRef<HTMLDivElement>(null);

  // Initialize our custom hooks
  const { allLogs, clearLogs } = useLogStream();
  const {
    filteredLogs,
    searchTerm,
    setSearchTerm,
    selectedLevels,
    isLevelFilterOpen,
    setIsLevelFilterOpen,
    toggleLogLevel,
    resetFilters
  } = useLogFiltering({ allLogs });
  const { handleUserScroll, isFollowing, toggleFollowing } = useLogAutoScroll({
    scrollContainerRef: logsContainerRef,
    filteredLogs
  });

  // Close level filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (levelFilterRef.current && !levelFilterRef.current.contains(event.target as Node)) {
        setIsLevelFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsLevelFilterOpen]);

  return (
    <div className='bg-gray-900 text-gray-200 rounded-lg shadow-lg p-2 flex flex-col' style={{ height: '550px' }}>
      {/* Toolbar with search, filter and action buttons */}
      <LogToolbar
        searchTerm={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        selectedLevels={selectedLevels}
        onLevelChange={toggleLogLevel}
        onClear={clearLogs}
        isFollowing={isFollowing}
        isLevelFilterOpen={isLevelFilterOpen}
        setIsLevelFilterOpen={setIsLevelFilterOpen}
        levelFilterRef={levelFilterRef}
        onToggleFollowing={toggleFollowing}
      />

      {/* Active filter chips */}
      <ActiveFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedLevels={selectedLevels}
        onLevelChange={toggleLogLevel}
        onResetAll={resetFilters}
      />

      {/* Log entries display */}
      <LogDisplay
        filteredLogs={filteredLogs}
        scrollContainerRef={logsContainerRef}
        onUserScroll={handleUserScroll}
        isFollowing={isFollowing}
      />
    </div>
  );
};

export default LogsViewer;
