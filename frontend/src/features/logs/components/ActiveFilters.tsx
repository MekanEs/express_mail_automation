import { FC } from 'react';
import { LogEntry } from '../hooks/useLogStream';

interface ActiveFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedLevels: Set<LogEntry['level']>;
  onLevelChange: (level: LogEntry['level']) => void;
  onResetAll: () => void;
}

// SVG icon component
const XMarkIcon: FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-4 h-4 ml-1 hover:text-red-400"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

export const ActiveFilters: FC<ActiveFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedLevels,
  onLevelChange,
  onResetAll
}) => {
  const levelOptions: LogEntry['level'][] = ['info', 'warn', 'error', 'debug'];
  const hasActiveFilters = selectedLevels.size < 4 || searchTerm.trim() !== '';

  if (!hasActiveFilters) return null;

  return (
    <div className="px-2 py-2 bg-gray-700 flex flex-wrap gap-2 items-center">
      <span className="text-sm font-medium text-gray-300 mr-2">Активные фильтры:</span>

      {/* Search term chip */}
      {searchTerm && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-gray-100">
          Поиск: "{searchTerm}"
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="-mr-1 ml-1.5 p-0.5 rounded-full inline-flex items-center justify-center text-gray-400 hover:bg-gray-500 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <XMarkIcon />
          </button>
        </span>
      )}

      {/* Log level chips */}
      {levelOptions
        .filter(level => selectedLevels.has(level) && selectedLevels.size < 4)
        .map(level => (
          <span key={level} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-gray-100 capitalize">
            {level}
            <button
              type="button"
              onClick={() => onLevelChange(level)}
              className="-mr-1 ml-1.5 p-0.5 rounded-full inline-flex items-center justify-center text-gray-400 hover:bg-gray-500 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <XMarkIcon />
            </button>
          </span>
        ))
      }

      {/* Reset button */}
      <button
        type="button"
        className="ml-auto text-xs text-blue-400 hover:text-blue-300 underline"
        onClick={onResetAll}
      >
        Сбросить все
      </button>
    </div>
  );
};
