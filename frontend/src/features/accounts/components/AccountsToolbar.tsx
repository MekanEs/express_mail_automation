import { FC } from 'react';
import { SelectableAccount } from '../../../types/types';

interface AccountsToolbarProps {
  selected: SelectableAccount[]
  onReload: () => void;
  onCheckAccounts: (accounts: SelectableAccount[]) => void
  onSelectAll: () => void;
  onClearAll: () => void;
  isChecking: boolean;
  canSelectAll: boolean;
  canClearAll: boolean;
  totalAccountsCount: number;
}

export const AccountsToolbar: FC<AccountsToolbarProps> = ({
  selected,
  onReload,
  onCheckAccounts,
  onSelectAll,
  onClearAll,
  isChecking,
  canSelectAll,
  canClearAll,
  totalAccountsCount
}) => {
  return (
    <div className="card-header relative">
      <button
        onClick={onReload}
        className="btn absolute top-2 right-2 p-2 text-lg text-text-secondary hover:text-primary hover:bg-gray-100 rounded"
        aria-label="Обновить аккаунты"
      >
        ↻
      </button>
      <h2 className="text-xl font-semibold text-text-primary mb-2">Аккаунты</h2>
      <div className="flex space-x-2">
        <button
          onClick={() => onCheckAccounts(selected)}
          disabled={isChecking || totalAccountsCount === 0}
          className="btn btn-secondary"
        >
          {isChecking ? 'Проверка...' : 'Проверить'}
        </button>
        <button
          onClick={onSelectAll}
          disabled={!canSelectAll}
          className="btn"
        >
          Выбрать все
        </button>
        <button
          onClick={onClearAll}
          disabled={!canClearAll}
          className="btn"
        >
          Очистить все
        </button>
      </div>
    </div>
  );
};
