import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { account, Provider, SelectableAccount } from '../../../types/types';
import { checkAccounts, getAccounts } from '../api';
import { useAccountStatusCache } from './useAccountStatusCache';
import toast from 'react-hot-toast';

export const useAccountsManager = (
  initialSelectedAccounts: SelectableAccount[] = [],
  setSelectedAccounts?: (selected: SelectableAccount[]) => void
) => {
  const { checked, saveChecked } = useAccountStatusCache();
  const queryClient = useQueryClient();
  const [selectedAccounts, setSelectedInternal] = useState<SelectableAccount[]>(initialSelectedAccounts);
  const [accountsSortedByProvider, setAccountsSortedByProvider] = useState<Record<Provider, SelectableAccount[]> | null>(null);

  // Функция для изменения выбранных аккаунтов (либо внутреннее состояние, либо переданный из пропсов метод)
  const setSelected = setSelectedAccounts || setSelectedInternal;

  // Запрос аккаунтов
  const { data: accounts = [], isFetching } = useQuery<SelectableAccount[]>({
    queryKey: ['accounts'],
    queryFn: getAccounts
  });

  // Сортировка аккаунтов по провайдеру
  useEffect(() => {
    setAccountsSortedByProvider(accounts.reduce((accumulator, account) => {
      const provider = account.provider as Provider;
      if (accumulator[provider]) {
        accumulator[provider].push(account);
      } else {
        accumulator[provider] = [account];
      }
      return accumulator;
    }, {} as Record<Provider, SelectableAccount[]>));
  }, [accounts]);

  // Мутация для проверки аккаунтов
  const checkAccountsMutation = useMutation({
    mutationFn: (accountsToCheck: account[]) => checkAccounts(accountsToCheck),
    onSuccess: (data) => {
      saveChecked(data);
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success(`Checked ${accounts.length} accounts. ${data.length} connected.`);
    },
    onError: (error) => {
      toast.error(`Account check failed: ${error.message}`);
    }
  });

  // Обработчик проверки аккаунтов
  const handleCheck = () => {
    checkAccountsMutation.mutate(accounts);
  };

  // Обработчик переключения выбора аккаунта
  const toggleAccountSelection = (account: account, isSelected: boolean) => {
    let newSelection: SelectableAccount[];
    if (isSelected) {
      const accountToAdd = accounts.find((acc) => acc.id === account.id);

      if (accountToAdd) {
        accountToAdd.is_selected = true;
        newSelection = [...(setSelectedAccounts ? initialSelectedAccounts : selectedAccounts), accountToAdd];
      } else {
        newSelection = setSelectedAccounts ? initialSelectedAccounts : selectedAccounts;
      }
    } else {
      newSelection = (setSelectedAccounts ? initialSelectedAccounts : selectedAccounts)
        .filter((acc) => acc.id !== account.id);
    }
    setSelected(newSelection);
  };

  // Выбрать все аккаунты
  const selectAll = () => {
    const allSelectable = accounts.map((acc) => ({
      ...acc,
      is_selected: true
    }));
    setSelected(allSelectable);
  };

  // Выбрать все аккаунты от одного провайдера
  const selectByProvider = (provider: string) => {
    // Получаем все текущие выбранные аккаунты (чтобы сохранить уже выбранные)
    const currentSelected = setSelectedAccounts ? initialSelectedAccounts : selectedAccounts;

    // Находим все аккаунты этого провайдера
    const providerAccounts = accounts.filter(acc => acc.provider === provider);

    // Создаем новый массив, исключая аккаунты этого провайдера, которые могут уже быть выбраны
    const withoutCurrentProvider = currentSelected.filter(acc => acc.provider !== provider);

    // Добавляем все аккаунты этого провайдера с is_selected = true
    const newSelection = [
      ...withoutCurrentProvider,
      ...providerAccounts.map(acc => ({ ...acc, is_selected: true }))
    ];

    setSelected(newSelection);
  };

  // Очистить все выбранные аккаунты
  const clearAll = () => {
    setSelected([]);
  };

  // Обновить список аккаунтов
  const reloadAccounts = () => {
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
  };

  return {
    accounts,
    isFetching,
    accountsSortedByProvider,
    selectedAccounts: setSelectedAccounts ? initialSelectedAccounts : selectedAccounts,
    checked,
    isCheckingAccounts: checkAccountsMutation.isPending,
    toggleAccountSelection,
    handleCheck,
    selectAll,
    selectByProvider,
    clearAll,
    reloadAccounts,
    canSelectAll: accounts.length > 0 && accounts.length !== (setSelectedAccounts ? initialSelectedAccounts : selectedAccounts).length,
    canClearAll: (setSelectedAccounts ? initialSelectedAccounts : selectedAccounts).length > 0
  };
};
