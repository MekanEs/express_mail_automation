import React, { FC } from 'react';

interface AccountsToolbarProps {
  onReload: () => void;
  onCheckAccounts: () => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  isChecking: boolean;
  canSelectAll: boolean;
  canClearAll: boolean;
  totalAccountsCount: number;
}

export const AccountsToolbar: FC<AccountsToolbarProps> = ({
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
        aria-label="Reload accounts"
      >
        ↻
      </button>
      <h2 className="text-xl font-semibold text-text-primary mb-2">Accounts</h2>
      <div className="flex space-x-2">
        <button
          onClick={onCheckAccounts}
          disabled={isChecking || totalAccountsCount === 0}
          className="btn btn-secondary"
        >
          {isChecking ? 'Checking...' : 'Check'}
        </button>
        <button
          onClick={onSelectAll}
          disabled={!canSelectAll}
          className="btn"
        >
          Select All
        </button>
        <button
          onClick={onClearAll}
          disabled={!canClearAll}
          className="btn"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};
