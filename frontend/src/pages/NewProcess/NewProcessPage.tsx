import { useProcessPageData } from './hooks/useProcessPageData';
import Accounts from '../../features/accounts/components/Accounts';
import { EmailList } from '../../features/emails/components/EmailList';
import { ProcessForm } from '../../features/processes/components/ProcessForm';
import LogsViewer from '../../features/logs/components/LogsViewer';
import { useProcessSelections } from './hooks/useProcessSelections';

export const NewProcessPage: React.FC = () => {
    const {
        availableAccounts, isLoadingAccounts, isErrorAccounts, errorAccounts,
        availableSenders, isLoadingSenders, isErrorSenders, errorSenders
    } = useProcessPageData();

    const { selectedAccounts, setSelectedAccounts, selectedSenders, setSelectedSenders } =
        useProcessSelections(availableAccounts, availableSenders);

    return (
        <div className="mx-auto p-2">
            {(isLoadingAccounts || isLoadingSenders) && (
                <div className="text-center p-4">Загрузка доступных аккаунтов и отправителей...</div>
            )}
            {(isErrorAccounts || isErrorSenders) && (
                <div className="text-center p-4 text-red-600">
                    {isErrorAccounts && `Ошибка загрузки аккаунтов: ${errorAccounts?.message || 'Неизвестная ошибка'}`}
                    {isErrorSenders && `Ошибка загрузки отправителей: ${errorSenders?.message || 'Неизвестная ошибка'}`}
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


                    <div className="my-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700">
                        <p className="font-semibold">Сводка по процессу:</p>
                        <ul className="list-disc list-inside ml-4">
                            <li>Выбрано аккаунтов: <strong>{selectedAccounts.length}</strong></li>
                            <li>Выбрано отправителей: <strong>{selectedSenders.length}</strong></li>
                        </ul>
                    </div>


                    <ProcessForm
                        selectedAccounts={selectedAccounts}
                        selectedSenders={selectedSenders}
                    />
                </div>
            )}
            <div className='mt-4 p-2'>
                <LogsViewer />
            </div>
        </div>
    );
};
