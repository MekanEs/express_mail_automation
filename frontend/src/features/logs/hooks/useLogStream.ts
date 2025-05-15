import { useState, useEffect } from 'react';
import { BASE_API } from '../../../shared/api/constants';

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: unknown[];
  timestamp: string;
}

/**
 * Hook to handle the Server-Sent Events (SSE) connection for log streaming
 */
export const useLogStream = () => {
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const eventSource = new EventSource(`${BASE_API}/logs/stream`);

    eventSource.onopen = () => console.log('SSE connection established');

    eventSource.onmessage = (event) => {
      try {
        const newLog: LogEntry = JSON.parse(event.data);
        setAllLogs((prevLogs) => [...prevLogs, newLog]);
      } catch (error) {
        console.error('Failed to parse log data:', event.data, error);
        setAllLogs(prev => [...prev, {
          level: 'error',
          message: ['Ошибка парсинга данных лога от сервера.'],
          timestamp: new Date().toISOString()
        }]);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      setAllLogs(prev => [...prev, {
        level: 'error',
        message: ['Ошибка соединения с потоком логов. Попытка переподключения...'],
        timestamp: new Date().toISOString()
      }]);
    };

    return () => {
      console.log('Closing SSE connection');
      eventSource.close();
    };
  }, []);

  const clearLogs = () => {
    setAllLogs([]);
  };

  return { allLogs, clearLogs };
};
