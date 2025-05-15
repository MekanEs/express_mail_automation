import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { startProcess } from '../api';
import { ProcessRequestBody, StartProcessResponse } from '../../../types/types';

/**
 * Хук для мутации запуска нового процесса.
 */
export const useStartProcess = () => {
  const queryClient = useQueryClient();

  return useMutation<StartProcessResponse, Error, ProcessRequestBody>({
    mutationFn: startProcess,
    onSuccess: (data) => {
      toast.success(`Process started successfully! ID: ${data.process_id}`);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
    },
    onError: (error) => {
      console.error("Error starting process:", error);
      toast.error(`Failed to start process: ${error.message}`);
    },
  });
};
