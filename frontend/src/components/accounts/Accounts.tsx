import { FC } from 'react';
import { SelectableAccount } from '../../types/types';
import Loader from '../Loader/Loader';
import { useAccountsManager } from '../../features/accounts/hooks/useAccountsManager';
import { AccountsToolbar } from '../../features/accounts/components/AccountsToolbar';
import { AccountsByProviderList } from '../../features/accounts/components/AccountsByProviderList';

interface AccountsProps {
    selected: SelectableAccount[];
    setSelected: (selected: SelectableAccount[]) => void;
}

const Accounts: FC<AccountsProps> = ({ selected, setSelected }) => {
    // Используем новый хук, передавая ему текущее состояние выбранных аккаунтов и функцию обновления
    const {
        accounts,
        isFetching,
        accountsSortedByProvider,
        checked,
        isCheckingAccounts,
        toggleAccountSelection,
        handleCheck,
        selectAll,
        selectByProvider,
        clearAll,
        reloadAccounts,
        canSelectAll,
        canClearAll
    } = useAccountsManager(selected, setSelected);

    return (
        <div className="card-content">
            {/* Панель инструментов */}
            <AccountsToolbar
                onReload={reloadAccounts}
                onCheckAccounts={handleCheck}
                onSelectAll={selectAll}
                onClearAll={clearAll}
                isChecking={isCheckingAccounts}
                canSelectAll={canSelectAll}
                canClearAll={canClearAll}
                totalAccountsCount={accounts.length}
            />

            {isFetching ? (
                <Loader />
            ) : accounts.length === 0 ? (
                <div className="empty-state">
                    <p>No accounts found</p>
                </div>
            ) : (
                <>
                    <h3 className="text-text-secondary text-lg mt-4 ">Кол-во аккаунтов: {accounts.length}</h3>

                    {/* Список аккаунтов по провайдерам */}
                    <AccountsByProviderList
                        accountsSortedByProvider={accountsSortedByProvider}
                        selectedAccounts={selected}
                        checkedEmails={checked}
                        onToggleAccount={toggleAccountSelection}
                        onSelectProvider={selectByProvider}
                    />
                </>
            )}
        </div>
    );
};

export default Accounts;
