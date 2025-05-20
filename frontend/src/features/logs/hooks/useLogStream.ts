import { useState, useEffect } from 'react';
import { BASE_API } from '../../../shared/api/constants';

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: unknown[];
  timestamp: string;
}

const MAX_LOGS = 2000; // Максимальное количество логов для хранения

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
        setAllLogs((prevLogs) => {
          const updatedLogs = [...prevLogs, newLog];
          return updatedLogs.length > MAX_LOGS
            ? updatedLogs.slice(updatedLogs.length - MAX_LOGS)
            : updatedLogs;
        });
      } catch (error) {
        console.error('Failed to parse log data:', event.data, error);
        setAllLogs(prev => {
          const errorLog: LogEntry = {
            level: 'error',
            message: ['Ошибка парсинга данных лога от сервера.'],
            timestamp: new Date().toISOString()
          };
          const updatedLogs = [...prev, errorLog];
          return updatedLogs.length > MAX_LOGS
            ? updatedLogs.slice(updatedLogs.length - MAX_LOGS)
            : updatedLogs;
        });
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      setAllLogs(prev => {
        const errorLog: LogEntry = {
          level: 'error',
          message: ['Ошибка соединения с потоком логов. Попытка переподключения...'],
          timestamp: new Date().toISOString()
        };
        const updatedLogs = [...prev, errorLog];
        return updatedLogs.length > MAX_LOGS
          ? updatedLogs.slice(updatedLogs.length - MAX_LOGS)
          : updatedLogs;
      });
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
