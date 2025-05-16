import { useQuery } from '@tanstack/react-query';
import { getEmails } from '../api'; // Changed from getFromEmails and path adjusted
import { FromEmail } from '../../../types/types'; // Changed to FromEmail

/**
 * Хук для получения списка email адресов отправителей (теперь используется getEmails).
 * @param options - Опции для useQuery (например, staleTime).
 */
export const useSenders = (options?: {
  staleTime?: number;
}) => {
  return useQuery<FromEmail[], Error>({
    queryKey: ['emails'], // Changed queryKey to 'emails' for consistency with getEmails
    queryFn: getEmails,    // Changed to getEmails
    staleTime: options?.staleTime ?? 1000 * 60 * 15,
  });
};
