import { FC, ChangeEvent, RefObject } from 'react';
import { LogEntry } from '../hooks/useLogStream';
import { LogLevelFilter } from './LogLevelFilter';

interface LogToolbarProps {
  searchTerm: string;
  onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
  selectedLevels: Set<LogEntry['level']>;
  onLevelChange: (level: LogEntry['level']) => void;
  onClear: () => void;
  isLevelFilterOpen: boolean;
  setIsLevelFilterOpen: (isOpen: boolean) => void;
  levelFilterRef: RefObject<HTMLDivElement | null>
  isFollowing: boolean;
  onToggleFollowing: () => void;
}

// SVG icon component
const SearchIcon: FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5 text-gray-400"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

export const LogToolbar: FC<LogToolbarProps> = ({
  searchTerm,
  onSearchChange,
  selectedLevels,
  onLevelChange,
  onClear,
  isLevelFilterOpen,
  setIsLevelFilterOpen,
  levelFilterRef,
  isFollowing,
  onToggleFollowing
}) => {
  // Helper function to generate button classes
  const getButtonClass = (primary = false, active = false) =>
    `px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${primary
      ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
      : active
        ? 'bg-gray-600 hover:bg-gray-500 text-white focus:ring-gray-500'
        : 'bg-gray-700 hover:bg-gray-600 text-gray-200 focus:ring-gray-500'
    }`;

  return (
    <div className='flex flex-wrap items-center gap-3 bg-gray-800 p-2 rounded-t-lg mb-1'>
      <h2 className="text-lg font-semibold text-white mr-auto sm:mr-4">Логи Сервера</h2>

      {/* Search input */}
      <div className="relative flex-grow min-w-[150px] sm:min-w-[200px]">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon />
        </div>
        <input
          type="search"
          aria-label="Поиск по логам"
          placeholder="Поиск..."
          value={searchTerm}
          onChange={onSearchChange}
          className="block w-full bg-gray-700 border border-gray-600 rounded-md py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Log level filter */}
      <LogLevelFilter
        selectedLevels={selectedLevels}
        onLevelChange={onLevelChange}
        isLevelFilterOpen={isLevelFilterOpen}
        setIsLevelFilterOpen={setIsLevelFilterOpen}
        levelFilterRef={levelFilterRef}
      />

      {/* Action buttons */}
      <button
        className={getButtonClass(true)}
        onClick={onClear}
      >
        Очистить
      </button>
      <button
        className={getButtonClass(false, !isFollowing)}
        onClick={onToggleFollowing}
      >
        {!isFollowing ? 'Следовать' : 'Пауза'}
      </button>
    </div>
  );
};
