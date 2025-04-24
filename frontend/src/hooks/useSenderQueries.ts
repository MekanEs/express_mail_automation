import { useQuery } from '@tanstack/react-query';
import { getFromEmails } from '../api/sendersApi';
import { from_email } from '../types/types';

/**
 * Хук для получения списка email адресов отправителей.
 * @param options - Опции для useQuery (например, staleTime).
 */
export const useSenders = (options?: {
    staleTime?: number;
}) => {
    return useQuery<from_email[], Error>({
        queryKey: ['senders'], // Уникальный ключ для запроса
        queryFn: getFromEmails, // Функция API
        staleTime: options?.staleTime ?? 1000 * 60 * 15, // Кешируем на 15 минут
    });
}; 