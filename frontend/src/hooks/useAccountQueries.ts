import { useQuery } from '@tanstack/react-query';
import { getAccounts } from '../api/accountsApi';
import { account } from '../types/types';

/**
 * Хук для получения списка доступных аккаунтов.
 * @param options - Опции для useQuery (например, staleTime).
 */
export const useAccounts = (options?: {
    staleTime?: number;
}) => {
    return useQuery<account[], Error>({
        queryKey: ['accounts'], // Уникальный ключ для запроса списка аккаунтов
        queryFn: getAccounts, // Функция API для вызова
        staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 минут по умолчанию
        // Можно добавить placeholderData и т.д.
    });
};
