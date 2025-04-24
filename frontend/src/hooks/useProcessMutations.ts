import { useMutation, } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { startProcess } from '../api/processApi';
import { ProcessRequestBody, StartProcessResponse } from '../types/types';

/**
 * Хук для мутации запуска нового процесса.
 */
export const useStartProcess = () => {

    return useMutation<StartProcessResponse, Error, ProcessRequestBody>({
        mutationFn: startProcess, // Функция API для вызова
        onSuccess: (data) => {
            toast.success(`Process started successfully! ID: ${data.process_id}`);

            // Опционально: инвалидировать запросы, которые могут быть затронуты
            // queryClient.invalidateQueries({ queryKey: ['reports'] }); // Например, если нужно обновить список отчетов
            // queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] }); // Обновить дашборд

            // Перенаправить на страницу деталей процесса
        },
        onError: (error) => {
            console.error("Error starting process:", error);
            toast.error(`Failed to start process: ${error.message}`);
        },
    });
};
