import { useState } from 'react';
import { ProcessRequestBody, SelectableAccount, SelectableEmail } from '../../../types/types';
import { useStartProcess } from './useProcessMutations';
import toast from 'react-hot-toast';

interface UseProcessFormOptions {
  initialLimit?: number;
  initialOpenRate?: number;
  initialRepliesCount?: number;
}

export const useProcessForm = (options: UseProcessFormOptions = {}) => {
  // Начальные состояния с дефолтными значениями или переданными опциями
  const [limit, setLimit] = useState(options.initialLimit ?? 10);
  const [openRate, setOpenRate] = useState(options.initialOpenRate ?? 70);
  const [repliesCount, setRepliesCount] = useState(options.initialRepliesCount ?? 0);

  // Получаем мутацию запуска процесса
  const startProcessMutation = useStartProcess();

  // Валидация формы
  const validateForm = (selectedAccounts: SelectableAccount[], selectedSenders: SelectableEmail[]): boolean => {
    if (selectedAccounts.length === 0) {
      toast.error('Please select at least one account.');
      return false;
    }

    if (selectedSenders.length === 0) {
      toast.error('Please select at least one sender.');
      return false;
    }

    if (limit < 1) {
      toast.error('Limit must be at least 1.');
      return false;
    }

    if (openRate < 0 || openRate > 100) {
      toast.error('Open rate must be between 0 and 100.');
      return false;
    }

    if (repliesCount < 0) {
      toast.error('Replies count cannot be negative.');
      return false;
    }

    return true;
  };

  // Обработчик отправки формы
  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
    selectedAccounts: SelectableAccount[],
    selectedSenders: SelectableEmail[]
  ) => {
    event.preventDefault();

    if (!validateForm(selectedAccounts, selectedSenders)) {
      return;
    }

    const processData: ProcessRequestBody = {
      // Удаляем is_selected из аккаунтов
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      accounts: selectedAccounts.map(({ is_selected, ...rest }) => rest),
      // Фильтруем null email значения
      emails: selectedSenders
        .map((s) => s.email)
        .filter((email): email is string => email !== null),
      limit,
      openRate,
      repliesCount
    };

    console.log('Submitting process data:', processData);
    startProcessMutation.mutate(processData);
  };

  return {
    limit,
    setLimit,
    openRate,
    setOpenRate,
    repliesCount,
    setRepliesCount,
    handleSubmit,
    isPending: startProcessMutation.isPending
  };
};
