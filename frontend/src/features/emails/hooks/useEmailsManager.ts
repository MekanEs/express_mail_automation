import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addEmail, deleteEmail, getEmails } from "../api.ts";
import toast from "react-hot-toast";
import { FromEmail } from "../../../types/types";
import { useState } from "react";

export const useEmailsManager = () => {
  const [curEmail, setCurEmail] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const queryClient = useQueryClient();

  const { data: emails = [], isLoading } = useQuery<FromEmail[], Error>({
    queryKey: ['emails'],
    queryFn: getEmails,
  });

  const addEmailMutation = useMutation<void, Error, string>({
    mutationFn: addEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      setCurEmail('');
      toast.success(`Email ${curEmail} added successfully!`);
    },
    onError: (error: Error, newEmail: string) => {
      toast.error(`Failed to add email ${newEmail}: ${error.message}`);
    }
  });

  const deleteEmailMutation = useMutation<void, Error, number>({
    mutationFn: deleteEmail,
    onSuccess: (_data, deletedEmailId) => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      const deletedEmailObject = emails.find((e: FromEmail) => e.id === deletedEmailId);
      toast.success(`Email ${deletedEmailObject?.email || deletedEmailId} deleted.`);
      setSelectedIds(prev => prev.filter(id => id !== deletedEmailId));
    },
    onError: (error: Error, deletedEmailId: number) => {
      const deletedEmailObject = emails.find((e: FromEmail) => e.id === deletedEmailId);
      toast.error(`Failed to delete email ${deletedEmailObject?.email || deletedEmailId}: ${error.message}`);
    }
  });

  const handleAddEmail = () => {
    if (curEmail.trim()) {
      addEmailMutation.mutate(curEmail);
    }
  };

  const handleDeleteEmail = (id: number) => {
    deleteEmailMutation.mutate(id);
  };

  const toggleSelectionById = (id: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  return {
    emails,
    isLoading,
    curEmail,
    setCurEmail,
    selectedIds,
    handleAddEmail,
    handleDeleteEmail,
    toggleSelectionById,
    isPendingAdd: addEmailMutation.isPending,
    isPendingDelete: deleteEmailMutation.isPending
  };
};
