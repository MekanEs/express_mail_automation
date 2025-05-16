import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { deleteReports, archiveSenderAggregates, DeleteReportsParams, deleteEmptyReports } from "../api"; // Import API functions and types

export const useDeleteReports = () => {
  const queryClient = useQueryClient();
  const { mutate: runDeleteReports, isPending: isDeleting } = useMutation<void, Error, DeleteReportsParams>({
    mutationFn: deleteReports,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Reports deleted successfully.');
    },
    onError: (error) => {
      console.error("Error deleting reports:", error);
      toast.error(`Failed to delete reports: ${error.message}`);
    },
  });
  return { deleteReports: runDeleteReports, isDeleting };
};

export const useDeleteEmptyReports = () => {
  const queryClient = useQueryClient();
  const { mutate: runDeleteEmptyReports, isPending: isDeleting } = useMutation<void, Error, void>({
    mutationFn: deleteEmptyReports,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Empty reports deleted successfully.');
    },
    onError: (error) => {
      console.error("Error deleting empty reports:", error);
      toast.error(`Failed to delete empty reports: ${error.message}`);
    },
  });
  return { deleteEmptyReports: runDeleteEmptyReports, isDeleting };
};

export const useArchiveSenderAggregates = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string, count?: number }, Error, void>({
    mutationFn: archiveSenderAggregates,
    onSuccess: (data) => {
      toast.success(data.message || 'Агрегаты отправителей успешно заархивированы!');
      queryClient.invalidateQueries({ queryKey: ['senderAggregatesArchive'] });
    },
    onError: (error) => {
      toast.error(`Ошибка архивации: ${error.message}`);
    },
  });
};
