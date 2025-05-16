import { useQuery } from '@tanstack/react-query';
import { getAccounts } from '../api'; // Adjusted path
import { Account } from '../../../types/types'; // Adjusted path, changed to Account

/**
 * Хук для получения списка доступных аккаунтов.
 * @param options - Опции для useQuery (например, staleTime).
 */
export const useAccounts = (options?: {
  staleTime?: number;
}) => {
  return useQuery<Account[], Error>({
    queryKey: ['accounts'],
    queryFn: getAccounts,
    staleTime: options?.staleTime ?? 1000 * 60 * 5,
  });
};
