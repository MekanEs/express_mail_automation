import React, { FC } from 'react';
import { Account } from '../../../types/types';

interface AccountItemProps {
  account: Account;
  isSelected: boolean;
  isChecked: boolean;
  onToggleSelect: (account: Account, isSelected: boolean) => void;
}

export const AccountItem: FC<AccountItemProps> = ({
  account,
  isSelected,
  isChecked,
  onToggleSelect
}) => {
  return (
    <li
      onClick={() => onToggleSelect(account, !isSelected)}
      className="px-4 py-2 w-100 flex grow items-center justify-between rounded cursor-pointer bg-gray-100 hover:bg-white "
    >
      <div className="text-text-primary cursor-pointer">{account.email}</div>
      <div className="item-actions">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              id={`select-${account.id}`}
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onToggleSelect(account, e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label
              htmlFor={`select-${account.id}`}
              className="ml-2 text-[8px] text-text-secondary"
            >
              Выбрать
            </label>
          </div>

          <div className="flex items-center">
            {isChecked ? (
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
