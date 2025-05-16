import { useState, useEffect } from 'react';
import { SelectableAccount, SelectableEmail } from '../../../types/types';

export const useProcessSelections = (availableAccounts: SelectableAccount[], availableSenders: SelectableEmail[]) => {
  const [selectedAccounts, setSelectedAccounts] = useState<SelectableAccount[]>([]);
  const [selectedSenders, setSelectedSenders] = useState<SelectableEmail[]>([]);

  // Reset account selection if the list of available accounts changes
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

  return {
    selectedAccounts,
    setSelectedAccounts,
    selectedSenders,
    setSelectedSenders,
  };
};
