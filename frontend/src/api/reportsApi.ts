import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    GetReportsParams,
    PaginatedReportsResponse,
} from "../types/types";
import toast from "react-hot-toast";
import { BASE_API } from "./constants";
import { handleApiResponse } from "../utils/apiUtils";

const API_URL = BASE_API; // Убедитесь, что URL правильный

// Функция для получения отчетов с пагинацией, сортировкой и фильтрацией
export const getReports = async (
    params: GetReportsParams = {}
): Promise<PaginatedReportsResponse> => {
    // Формируем строку запроса из параметров
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params.filter_status) queryParams.append('filter_status', params.filter_status);
    if (params.filter_account) queryParams.append('filter_account', params.filter_account);
    if (params.filter_process_id) queryParams.append('filter_process_id', params.filter_process_id);

    const queryString = queryParams.toString();
    const url = `${API_URL}/reports${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch reports: ${response.statusText}`);
    }

    return await response.json();
};
export type DeleteReportsParams = {
    process_id: string;
};
// Функция для запроса экспорта отчетов
export const deleteReports = async (
    params: DeleteReportsParams
): Promise<void> => {
    const url = `${API_URL}/reports/delete`;
    const response = await fetch(url, {
        method: 'DELETE',
        body: JSON.stringify(params),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete reports: ${response.statusText}`);
    }
    return await response.json();
};


export const useDeleteReports = () => {
    const queryClient = useQueryClient();
    const { mutate: runDeleteReports, isPending: isDeleting } = useMutation({
        mutationFn: (params: DeleteReportsParams) => deleteReports(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
        },
        onError: (error) => {
            console.error("Error deleting reports:", error);
            toast.error(`Failed to delete reports: ${error.message}`);
        },
    });
    return { deleteReports: runDeleteReports, isDeleting };
};
export const archiveSenderAggregates = async (): Promise<{ message: string, count?: number }> => {
    const response = await fetch(`${BASE_API}/admin/archive-sender-aggregates`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    // Предполагаем, что handleApiResponse корректно обрабатывает .json() и ошибки
    const checkedResponse = await handleApiResponse(response);
    return await checkedResponse.json();
};

// Добавьте этот хук
export const useArchiveSenderAggregates = () => {
    const queryClient = useQueryClient();
    return useMutation<{ message: string, count?: number }, Error, void>({ // void, так как нет аргументов для mutationFn
        mutationFn: archiveSenderAggregates,
        onSuccess: (data) => {
            toast.success(data.message || 'Агрегаты отправителей успешно заархивированы!');
            // Инвалидируем кеш для таблицы архива, чтобы она обновилась
            queryClient.invalidateQueries({ queryKey: ['senderAggregatesArchive'] });
            // Можно также инвалидировать и основной senderAggregates, если это имеет смысл
            // queryClient.invalidateQueries({ queryKey: ['senderAggregates'] });
        },
        onError: (error) => {
            toast.error(`Ошибка архивации: ${error.message}`);
        },
    });
};
