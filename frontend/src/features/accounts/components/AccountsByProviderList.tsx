import React, { FC } from 'react';
import { Provider, SelectableAccount } from '../../../types/types';
import { AccountItem } from './AccountItem';
import { account } from '../../../types/types';

interface AccountsByProviderListProps {
  accountsSortedByProvider: Record<Provider, SelectableAccount[]> | null;
  selectedAccounts: SelectableAccount[];
  checkedEmails: string[];
  onToggleAccount: (account: account, isSelected: boolean) => void;
  onSelectProvider: (provider: string) => void;
}

export const AccountsByProviderList: FC<AccountsByProviderListProps> = ({
  accountsSortedByProvider,
  selectedAccounts,
  checkedEmails,
  onToggleAccount,
  onSelectProvider
}) => {
  if (!accountsSortedByProvider) {
    return null;
  }

  return (
    <ul className="rounded bg-gray-200 m-auto mt-2 flex flex-wrap p-2 gap-2 justify-center">
      {Object.keys(accountsSortedByProvider).map(provider => (
        <div className="flex flex-col gap-1 p-2 rounded bg-gray-300" key={provider}>
          <button
            onClick={() => onSelectProvider(provider)}
            className="btn"
          >
            Select Provider
          </button>
          {accountsSortedByProvider[provider as Provider].map(account => (
            <AccountItem
              key={account.id}
              account={account}
              isSelected={selectedAccounts.some(a => a.id === account.id)}
              isChecked={checkedEmails.includes(account.email ?? '')}
              onToggleSelect={onToggleAccount}
            />
          ))}
        </div>
      ))}
    </ul>
  );
};
