// frontend/src/components/LogViewerNoVirtualization.tsx
import { useEffect, useState, useRef, FC, Fragment, useCallback, ChangeEvent } from 'react';
// Удаляем импорты react-window и react-virtualized-auto-sizer
// import { FixedSizeList as List } from 'react-window';
// import AutoSizer from 'react-virtualized-auto-sizer';
import { BASE_API } from '../../api/constants';

// Иконки остаются теми же
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-2"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>;
const XMarkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1 hover:text-red-400"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>;

interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: unknown[];
  timestamp: string;
}

// ITEM_HEIGHT больше не нужен для виртуализации, но может быть полезен для логики скролла
// const ITEM_HEIGHT = 28;

const TailwindLogViewerNoVirtualization: FC = () => {
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLevels, setSelectedLevels] = useState<Set<LogEntry['level']>>(new Set(['info', 'warn', 'error', 'debug']));
  const [isLevelFilterOpen, setIsLevelFilterOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Заменяем listRef на ref для обычного div, который будет содержать логи
  const logsContainerRef = useRef<HTMLDivElement | null>(null);
  const levelFilterRef = useRef<HTMLDivElement | null>(null);

  // 1. Получение логов по SSE (без изменений)
  useEffect(() => {
    const eventSource = new EventSource(`${BASE_API}/logs/stream`);
    eventSource.onopen = () => console.log('SSE connection established');
    eventSource.onmessage = (event) => {
      try {
        const newLog: LogEntry = JSON.parse(event.data);
        setAllLogs((prevLogs) => [...prevLogs, newLog]);
      } catch (error) {
        console.error('Failed to parse log data:', event.data, error);
        setAllLogs(prev => [...prev, { level: 'error', message: ['Ошибка парсинга данных лога от сервера.'], timestamp: new Date().toISOString() }]);
      }
    };
    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      setAllLogs(prev => [...prev, { level: 'error', message: ['Ошибка соединения с потоком логов. Попытка переподключения...'], timestamp: new Date().toISOString() }]);
    };
    return () => {
      console.log('Closing SSE connection');
      eventSource.close();
    };
  }, []);

  // 2. Фильтрация логов (без изменений)
  useEffect(() => {
    let tempFilteredLogs = allLogs;
    if (selectedLevels.size < 4) {
      tempFilteredLogs = tempFilteredLogs.filter(log => selectedLevels.has(log.level));
    }
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
    setFilteredLogs(tempFilteredLogs);
  }, [allLogs, searchTerm, selectedLevels]);

  // 3. Авто-скролл к последнему логу
  useEffect(() => {
    if (!isPaused && logsContainerRef.current) {
      const { scrollHeight, clientHeight } = logsContainerRef.current;
      // Скроллим, только если скроллбар не находится уже в самом низу (с небольшим допуском)
      // или если мы только что добавили новый лог и хотим быть уверены, что он виден.
      // Просто logsContainerRef.current.scrollTop = scrollHeight; может быть достаточно.
      logsContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  }, [filteredLogs, isPaused]); // Зависимость от filteredLogs, чтобы скроллить при их изменении

  // Закрытие выпадающего списка фильтра по клику вне его (без изменений)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (levelFilterRef.current && !levelFilterRef.current.contains(event.target as Node)) {
        setIsLevelFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLogColor = (level: LogEntry['level']): string => {
    // ... (без изменений) ...
    switch (level) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'debug': return 'text-gray-500';
      default: return 'text-blue-500';
    }
  };

  // LogRow теперь не принимает style от react-window, а просто рендерит лог
  // Он будет использоваться внутри .map()
  const RenderLogRow = ({ logEntry, logKey }: { logEntry: LogEntry; logKey: string | number }) => {
    if (!logEntry) return null;
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

  const handleClearLogs = () => {
    setAllLogs([]);
    setFilteredLogs([]);
  };

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
  };

  const onLevelSelectToggle = (level: LogEntry['level']) => {
    const newSelectedLevels = new Set(selectedLevels);
    if (newSelectedLevels.has(level)) {
      newSelectedLevels.delete(level);
    } else {
      newSelectedLevels.add(level);
    }
    setSelectedLevels(newSelectedLevels);
  };

  // Отключаем авто-скролл, если пользователь сам скроллит
  const handleUserScroll = useCallback(() => {
    if (logsContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
      // Если пользователь прокрутил вверх от самого низа, ставим на паузу
      // Допуск в несколько пикселей, чтобы избежать ложных срабатываний
      if (scrollHeight - scrollTop - clientHeight > 20) { // 20px - примерный допуск
        if (!isPaused) setIsPaused(true);
      } else {
        // Если пользователь доскроллил до низа, можно снять паузу (опционально)
        // if (isPaused) setIsPaused(false);
      }
    }
  }, [isPaused]);

  const levelOptions: LogEntry['level'][] = ['info', 'warn', 'error', 'debug'];

  const getButtonClass = (primary = false, active = false) =>
    `px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${primary
      ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
      : active
        ? 'bg-gray-600 hover:bg-gray-500 text-white focus:ring-gray-500'
        : 'bg-gray-700 hover:bg-gray-600 text-gray-200 focus:ring-gray-500'
    }`;

  return (
    <div className='bg-gray-900 text-gray-200 rounded-lg shadow-lg p-2 flex flex-col' style={{ height: '550px' }}>
      {/* Тулбар (без изменений) */}
      <div className='flex flex-wrap items-center gap-3 bg-gray-800 p-2 rounded-t-lg mb-1'>
        <h2 className="text-lg font-semibold text-white mr-auto sm:mr-4">Логи Сервера</h2>
        <div className="relative flex-grow min-w-[150px] sm:min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="search"
            aria-label="Поиск по логам"
            placeholder="Поиск..."
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="block w-full bg-gray-700 border border-gray-600 rounded-md py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
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
                      onChange={() => onLevelSelectToggle(level)}
                    />
                    <span className="ml-3 capitalize">{level}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <button className={getButtonClass(true)} onClick={handleClearLogs}>Очистить</button>
        <button className={getButtonClass(false, isPaused)} onClick={handlePauseToggle}>
          {isPaused ? 'Следовать' : 'Пауза'}
        </button>
      </div>

      {/* Отображение выбранных фильтров (чипы) (без изменений) */}
      {(selectedLevels.size < 4 || searchTerm) && (
        <div className="px-2 py-2 bg-gray-700 flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-300 mr-2">Активные фильтры:</span>
          {searchTerm && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-gray-100">
              Поиск: "{searchTerm}"
              <button type="button" onClick={() => setSearchTerm('')} className="-mr-1 ml-1.5 p-0.5 rounded-full inline-flex items-center justify-center text-gray-400 hover:bg-gray-500 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
                <XMarkIcon />
              </button>
            </span>
          )}
          {levelOptions.filter(level => selectedLevels.has(level) && selectedLevels.size < 4).map(level => (
            <span key={level} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-gray-100 capitalize">
              {level}
              <button type="button" onClick={() => onLevelSelectToggle(level)} className="-mr-1 ml-1.5 p-0.5 rounded-full inline-flex items-center justify-center text-gray-400 hover:bg-gray-500 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
                <XMarkIcon />
              </button>
            </span>
          ))}
          <button
            type="button"
            className="ml-auto text-xs text-blue-400 hover:text-blue-300 underline"
            onClick={() => { setSelectedLevels(new Set(levelOptions)); setSearchTerm(''); setIsLevelFilterOpen(false); }}
          >
            Сбросить все
          </button>
        </div>
      )}

      {/* Список логов БЕЗ виртуализации */}
      <div
        ref={logsContainerRef}
        className="flex-grow overflow-y-auto font-mono text-sm bg-gray-950 p-2" // Добавлен p-2 для отступов внутри
        onScroll={handleUserScroll} // Добавляем обработчик скролла
      >
        {filteredLogs.map((log, index) => (
          // Используем RenderLogRow вместо LogRow, чтобы передать ключ
          <RenderLogRow key={`${log.timestamp}-${index}`} logEntry={log} logKey={`${log.timestamp}-${index}`} />
        ))}
        {/* Пустой div для прокрутки к концу, если потребуется более точное позиционирование, но scrollTop должен справиться */}
        {/* <div ref={endOfLogsRef} /> */}
      </div>
    </div>
  );
};

export default TailwindLogViewerNoVirtualization;
