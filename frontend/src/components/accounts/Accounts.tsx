import { FC, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { account, Provider, SelectableAccount } from '../../types/types';
import { checkAccounts, getAccounts } from '../../api/accountsApi';
import { useAccountStatusCache } from '../../hooks/useAccountStatusCache';
import toast from 'react-hot-toast';
import Loader from '../Loader/Loader';

interface AccountsProps {
    selected: SelectableAccount[];
    setSelected: (selected: SelectableAccount[]) => void;
}

const Accounts: FC<AccountsProps> = ({ selected, setSelected }) => {
    const { checked, saveChecked } = useAccountStatusCache();
    const queryClient = useQueryClient();
    const [accountsSortedByProvider, setAccountsSortedByProvider] = useState<Record<Provider, SelectableAccount[]> | null>(null);
    const { data: accounts = [], isFetching } = useQuery<SelectableAccount[]>({
        queryKey: ['accounts'],
        queryFn: getAccounts
    });
    useEffect(() => {
        setAccountsSortedByProvider(accounts.reduce((accumulator, account) => {
            const provider = account.provider as Provider;
            if (accumulator[provider]) {
                accumulator[provider].push(account);
            } else {
                accumulator[provider] = [account];
            }
            return accumulator
        }, {} as Record<Provider, SelectableAccount[]>))
    }, [accounts]);
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

    const handleCheck = () => {
        checkAccountsMutation.mutate(accounts);
    };

    const handleToggleAccount = (account: account, isSelected: boolean) => {
        let newSelection: SelectableAccount[];
        if (isSelected) {
            const accountToAdd = accounts.find((acc) => acc.id === account.id);

            if (accountToAdd) {
                accountToAdd.is_selected = true;
                newSelection = [...selected, accountToAdd];
            } else {
                newSelection = selected; // Не должно произойти, но для безопасности
            }
        } else {
            newSelection = selected.filter((acc) => acc.id !== account.id);
        }
        setSelected(newSelection);
    };

    return (
        <div className="card-content">
            <div className="card-header relative">
                <button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['accounts'] })}
                    className="btn absolute top-2 right-2 p-2 text-lg text-text-secondary hover:text-primary hover:bg-gray-100 rounded"
                    aria-label="Reload accounts"
                >
                    ↻
                </button>
                <h2 className="text-xl font-semibold text-text-primary mb-2">Accounts</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={handleCheck}
                        disabled={checkAccountsMutation.isPending || accounts.length === 0}
                        className="btn btn-secondary"
                    >
                        {checkAccountsMutation.isPending ? 'Checking...' : 'Check'}
                    </button>
                    <button
                        onClick={() => {
                            const allSelectable = accounts.map((acc) => ({
                                ...acc,
                                is_selected: true
                            }));
                            setSelected(allSelectable);
                        }}
                        disabled={accounts.length === selected.length}
                        className="btn"
                    >
                        Select All
                    </button>
                    <button
                        onClick={() => setSelected([])}
                        disabled={selected.length === 0}
                        className="btn"
                    >
                        Clear All
                    </button>
                </div>
            </div>

            {isFetching ? (
                <Loader />
            ) : accounts.length === 0 ? (
                <div className="empty-state">
                    <p>No accounts found</p>
                </div>
            ) : (
                <>
                    <h3 className="text-text-secondary text-lg mt-4 ">Кол-во аккаунтов: {accounts.length}</h3>
                    <ul className="rounded bg-gray-200 m-auto mt-2 flex flex-wrap p-2 gap-2 justify-center">
                        {accountsSortedByProvider && Object.keys(accountsSortedByProvider).map(provider => {
                            return (
                                <div className="flex flex-col gap-1 p-2 rounded bg-gray-300" key={provider}>
                                    <button
                                        onClick={() => {
                                            const allSelectable = accounts.filter((acc) => {
                                                if (acc.provider === provider || selected.some((a) => a.id === acc.id)) {
                                                    return { ...acc, is_selected: true }
                                                }
                                            }
                                            );
                                            setSelected(allSelectable);
                                        }}
                                        className="btn"
                                    >
                                        Select Provider
                                    </button>
                                    {
                                        accountsSortedByProvider[provider as Provider].map(account =>
                                            <Account account={account} selected={selected} handleToggleAccount={handleToggleAccount} checked={checked} />
                                        )
                                    }
                                </div>
                            )
                        })}


                    </ul>
                </>
            )
            }
        </div >
    );
};

const Account = ({ account, selected, handleToggleAccount, checked }: { account: account, selected: SelectableAccount[], handleToggleAccount: (account: account, isSelected: boolean) => void, checked: string[] }) => {
    return (
        <li
            onClick={() => {
                handleToggleAccount(
                    account,
                    !selected.some((a) => a.id === account.id)
                );
            }}
            className="px-4 py-2 w-100 flex grow items-center justify-between rounded cursor-pointer bg-gray-100 hover:bg-white "
        >
            <div className="text-text-primary cursor-pointer">{account.email}</div>
            <div className="item-actions">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <input
                            id={`select-${account.id}`}
                            type="checkbox"
                            checked={selected.some((a) => a.id === account.id)}
                            onChange={(e) =>
                                handleToggleAccount(account, e.target.checked)
                            }
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label
                            htmlFor={`select-${account.id}`}
                            className="ml-2 text-[8px] text-text-secondary"
                        >
                            Select
                        </label>
                    </div>

                    <div className="flex items-center">
                        {checked.includes(account.email ?? '') ? (
                            <span className="inline-block w-2 h-2 bg-secondary rounded-full" />
                        ) : (
                            <span className="inline-block w-2 h-2 bg-gray-300 rounded-full" />
                        )}
                    </div>
                </div>
            </div>
        </li>
    );
};

export default Accounts;
