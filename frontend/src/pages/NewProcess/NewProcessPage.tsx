import { useState, useMemo, useEffect } from 'react';
import { SelectableAccount, SelectableEmail } from '../../types/types';
import { useAccounts } from '../../features/accounts/hooks/useAccountQueries';
import { useSenders } from '../../features/emails/hooks/useSenderQueries';
import Accounts from '../../features/accounts/components/Accounts';
import { EmailList } from '../../features/emails/components/EmailList';
import LogViewer from '../../components/LogsViewer/LogsViewer';
import { ProcessForm } from '../../features/processes/components/ProcessForm';

export const NewProcessPage: React.FC = () => {
    // Состояние для данных формы
    const [selectedAccounts, setSelectedAccounts] = useState<SelectableAccount[]>([]);
    const [selectedSenders, setSelectedSenders] = useState<SelectableEmail[]>([]);

    // Получаем доступные аккаунты с помощью хука
    const { data: accountsData, isLoading: isLoadingAccounts, isError: isErrorAccounts, error: errorAccounts } = useAccounts();
    const { data: sendersData, isLoading: isLoadingSenders, isError: isErrorSenders, error: errorSenders } = useSenders();

    // Преобразуем полученные аккаунты в SelectableAccount[]
    const availableAccounts: SelectableAccount[] = useMemo(() => {
        if (!accountsData) return [];
        return accountsData.map(acc => ({ ...acc, is_selected: false }));
    }, [accountsData]);

    // Transform fetched senders into SelectableEmail[]
    const availableSenders: SelectableEmail[] = useMemo(() => {
        if (!sendersData) return [];
        // Map sender data to SelectableEmail, ensuring is_selected is initially false
        return sendersData.map(sender => ({ ...sender, is_selected: false }));
    }, [sendersData]);

    // Сбрасываем выбор, если список доступных аккаунтов изменился (например, после refetch)
    // Это предотвращает ситуацию, когда выбран аккаунт, которого больше нет в списке
    useEffect(() => {
        setSelectedAccounts(currentSelection =>
            currentSelection.filter(selectedAcc =>
                availableAccounts.some(availableAcc => availableAcc.id === selectedAcc.id)
            )
        );
    }, [availableAccounts]);

    // Reset sender selection if the list of available senders changes
    useEffect(() => {
        setSelectedSenders(currentSelection =>
            currentSelection.filter(selectedSender =>
                availableSenders.some(availableSender => availableSender.email === selectedSender.email)
            )
        );
    }, [availableSenders]);

    return (
        <div className="mx-auto p-8">
            {(isLoadingAccounts || isLoadingSenders) && (
                <div className="text-center p-4">Loading available accounts and senders...</div>
            )}
            {(isErrorAccounts || isErrorSenders) && (
                <div className="text-center p-4 text-red-600">
                    {isErrorAccounts && `Error loading accounts: ${errorAccounts?.message || 'Unknown error'}`}
                    {isErrorSenders && `Error loading senders: ${errorSenders?.message || 'Unknown error'}`}
                </div>
            )}
            {!isLoadingAccounts && !isErrorAccounts && !isLoadingSenders && !isErrorSenders && (
                <div className=' p-4 bg-white rounded  shadow-md'>
                    <Accounts selected={selectedAccounts} setSelected={setSelectedAccounts} />
                    <EmailList
                        emails={availableSenders}
                        selected={selectedSenders}
                        toggleSelection={setSelectedSenders}
                    />
                    <ProcessForm
                        selectedAccounts={selectedAccounts}
                        selectedSenders={selectedSenders}


                    /></div>
            )}
            <div className='mt-4 p-2'>
                <LogViewer />
            </div>
        </div>
    );
};
