import { useState } from 'react';
import { ProcessRequestBody, SelectableAccount, SelectableEmail, Account } from '../../../types/types';
import { useStartProcess } from './useProcessMutations';
import toast from 'react-hot-toast';

interface UseProcessFormOptions {
  initialLimit?: number;
  initialOpenRate?: number;
  initialRepliesCount?: number;
}

interface FormErrors {
  selectedAccounts?: string;
  selectedSenders?: string;
  limit?: string;
  openRate?: string;
  repliesCount?: string;
}

// Explicit return type for the hook
interface UseProcessFormReturn {
  limit: number;
  setLimit: React.Dispatch<React.SetStateAction<number>>;
  openRate: number;
  setOpenRate: React.Dispatch<React.SetStateAction<number>>;
  repliesCount: number;
  setRepliesCount: React.Dispatch<React.SetStateAction<number>>;
  handleSubmit: (
    event: React.FormEvent<HTMLFormElement>,
    selectedAccounts: SelectableAccount[],
    selectedSenders: SelectableEmail[]
  ) => void;
  isPending: boolean;
  formErrors: FormErrors;
}

export const useProcessForm = (options: UseProcessFormOptions = {}): UseProcessFormReturn => {
  // Начальные состояния с дефолтными значениями или переданными опциями
  const [limit, setLimit] = useState(options.initialLimit ?? 10);
  const [openRate, setOpenRate] = useState(options.initialOpenRate ?? 70);
  const [repliesCount, setRepliesCount] = useState(options.initialRepliesCount ?? 0);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Получаем мутацию запуска процесса
  const startProcessMutation = useStartProcess();

  // Валидация формы
  const validateForm = (
    selectedAccounts: SelectableAccount[],
    selectedSenders: SelectableEmail[],
    currentLimit: number,
    currentOpenRate: number,
    currentRepliesCount: number
  ): FormErrors => {
    const errors: FormErrors = {};
    if (selectedAccounts.length === 0) {
      errors.selectedAccounts = 'Please select at least one account.';
    }

    if (selectedSenders.length === 0) {
      errors.selectedSenders = 'Please select at least one sender.';
    }

    if (currentLimit < 1) {
      errors.limit = 'Limit must be at least 1.';
    }

    if (currentOpenRate < 0 || currentOpenRate > 100) {
      errors.openRate = 'Open rate must be between 0 and 100.';
    }

    if (currentRepliesCount < 0) {
      errors.repliesCount = 'Replies count cannot be negative.';
    }

    return errors;
  };

  // Обработчик отправки формы
  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
    selectedAccounts: SelectableAccount[],
    selectedSenders: SelectableEmail[]
  ) => {
    event.preventDefault();

    const errors = validateForm(selectedAccounts, selectedSenders, limit, openRate, repliesCount);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Please correct the errors in the form.');
      return;
    }

    const processData: ProcessRequestBody = {
      accounts: selectedAccounts.map(({ is_selected: _is_selected, ...rest }): Account => rest),
      emails: selectedSenders
        .map((s) => s.email)
        .filter((email): email is string => email !== null),
      limit,
      openRate,
      repliesCount
    };

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
    isPending: startProcessMutation.isPending,
    formErrors
  };
};
