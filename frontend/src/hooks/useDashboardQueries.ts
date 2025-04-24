import { useQuery } from '@tanstack/react-query';
import { getDashboardMetrics } from '../api/dashboardApi';
import { DashboardMetrics } from '../types/types';

/**
 * Хук для получения метрик дашборда.
 * @param options - Опции для useQuery (например, staleTime).
 */
export const useDashboardMetrics = (options?: {
    staleTime?: number;
}) => {
    return useQuery<DashboardMetrics, Error>({
        queryKey: ['dashboardMetrics'], // Уникальный ключ для запроса
        queryFn: getDashboardMetrics, // Функция API для вызова
        staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 минут по умолчанию
        // Можно добавить placeholderData и т.д.
    });
}; 