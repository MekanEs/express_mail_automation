import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    GetReportsParams,
    PaginatedReportsResponse,
} from "../types/types";
import toast from "react-hot-toast";
import { BASE_API } from "./constants";

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
