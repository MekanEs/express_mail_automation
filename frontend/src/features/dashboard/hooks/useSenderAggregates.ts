import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getSenderAggregates, getSenderAggregatesArchive, archiveSenderAggregates, SenderAggregateRow, SenderAggregateArchiveRow } from '../api';
import toast from 'react-hot-toast';

export const useSenderAggregates = () => {
  const [showArchive, setShowArchive] = useState(false);
  const queryClient = useQueryClient();

  // Query for current aggregates
  const {
    data: currentData,
    isLoading: isLoadingCurrent,
    error: errorCurrent
  } = useQuery<SenderAggregateRow[], Error>({
    queryKey: ['senderAggregates'],
    queryFn: getSenderAggregates,
  });

  // Query for archive aggregates
  const {
    data: archiveData,
    isLoading: isLoadingArchive,
    error: errorArchive
  } = useQuery<SenderAggregateArchiveRow[], Error>({
    queryKey: ['senderAggregatesArchive'],
    queryFn: getSenderAggregatesArchive,
  });

  // Mutation for archiving data
  const {
    mutate: runArchive,
    isPending: isArchiving
  } = useMutation({
    mutationFn: archiveSenderAggregates,
    onSuccess: (data) => {
      toast.success(`${data.count} записей успешно архивировано`);
      // Invalidate both queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['senderAggregates'] });
      queryClient.invalidateQueries({ queryKey: ['senderAggregatesArchive'] });
    },
    onError: (error: Error) => {
      toast.error(`Ошибка при архивации: ${error.message}`);
    }
  });

  // Toggle between current and archive data
  const toggleView = () => {
    setShowArchive(prev => !prev);
  };

  // Handle archive action with confirmation
  const handleArchive = () => {
    if (window.confirm('Вы уверены, что хотите скопировать текущие агрегированные данные в архив? Существующие записи в архиве с теми же отправителями будут обновлены.')) {
      runArchive();
    }
  };

  // Determine which data to display based on showArchive state
  const displayData = showArchive ? archiveData : currentData;
  const isLoading = showArchive ? isLoadingArchive : isLoadingCurrent;
  const error = showArchive ? errorArchive : errorCurrent;

  return {
    data: displayData,
    isLoading,
    error,
    showArchive,
    toggleView,
    handleArchive,
    isArchiving
  };
};
