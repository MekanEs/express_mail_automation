import { FC, MutableRefObject } from 'react';
import { LogEntry } from '../hooks/useLogStream';

interface LogLevelFilterProps {
  selectedLevels: Set<LogEntry['level']>;
  onLevelChange: (level: LogEntry['level']) => void;
  isLevelFilterOpen: boolean;
  setIsLevelFilterOpen: (isOpen: boolean) => void;
  levelFilterRef: MutableRefObject<HTMLDivElement>;
}

// SVG icon component
const ChevronDownIcon: FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-4 h-4 ml-2"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

export const LogLevelFilter: FC<LogLevelFilterProps> = ({
  selectedLevels,
  onLevelChange,
  isLevelFilterOpen,
  setIsLevelFilterOpen,
  levelFilterRef
}) => {
  const levelOptions: LogEntry['level'][] = ['info', 'warn', 'error', 'debug'];

  return (
    <div className="relative min-w-[150px] sm:min-w-[180px]" ref={levelFilterRef}>
      <button
        type="button"
        className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm px-4 py-2 inline-flex justify-between items-center text-sm font-medium text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
        onClick={() => setIsLevelFilterOpen(!isLevelFilterOpen)}
      >
        {selectedLevels.size === 4 ? 'Все уровни' : `${selectedLevels.size} уров. выбрано`}
        <ChevronDownIcon />
      </button>

      {isLevelFilterOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {levelOptions.map(level => (
              <label key={level} className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                  checked={selectedLevels.has(level)}
                  onChange={() => onLevelChange(level)}
                />
                <span className="ml-3 capitalize">{level}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
