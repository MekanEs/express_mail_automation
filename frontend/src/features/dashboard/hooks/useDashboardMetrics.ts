import { useQuery } from '@tanstack/react-query';
import { getDashboardMetrics } from '../api';
import { DashboardMetrics } from '../../../types/types';

/**
 * Хук для получения метрик дашборда.
 * @param options - Опции для useQuery (например, staleTime).
 */
export const useDashboardMetrics = (options?: {
  staleTime?: number;
}) => {
  return useQuery<DashboardMetrics, Error>({
    queryKey: ['dashboardMetrics'],
    queryFn: getDashboardMetrics,
    staleTime: options?.staleTime ?? 1000 * 60 * 5,
  });
};
