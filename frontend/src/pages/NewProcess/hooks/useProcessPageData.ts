import { useAccounts } from '../../../features/accounts/hooks/useAccountQueries';
import { useSenders } from '../../../features/emails/hooks/useSenderQueries';
import { useMemo } from 'react';
import { SelectableAccount, SelectableEmail } from '../../../types/types';

export const useProcessPageData = () => {
  const { data: accountsData, isLoading: isLoadingAccounts, isError: isErrorAccounts, error: errorAccounts } = useAccounts();
  const { data: sendersData, isLoading: isLoadingSenders, isError: isErrorSenders, error: errorSenders } = useSenders();

  const availableAccounts: SelectableAccount[] = useMemo(() => {
    if (!accountsData) return [];
    return accountsData.map(acc => ({ ...acc, is_selected: false }));
  }, [accountsData]);

  const availableSenders: SelectableEmail[] = useMemo(() => {
    if (!sendersData) return [];
    return sendersData.map(sender => ({ ...sender, is_selected: false }));
  }, [sendersData]);

  return {
    availableAccounts,
    isLoadingAccounts,
    isErrorAccounts,
    errorAccounts,
    availableSenders,
    isLoadingSenders,
    isErrorSenders,
    errorSenders
  };
};
