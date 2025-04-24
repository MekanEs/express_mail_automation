import {
    GetReportsParams,
    PaginatedReportsResponse,
    ExportReportsParams
} from "../types/types";

const API_URL = 'http://localhost:3002/api'; // Убедитесь, что URL правильный

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

// Функция для запроса экспорта отчетов
export const exportReports = async (
    params: ExportReportsParams = {}
): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    // Добавляем все параметры фильтрации и сортировки, как в getReports
    if (params.format) queryParams.append('format', params.format);
    if (params.process_id) queryParams.append('process_id', params.process_id);
    if (params.filter_status) queryParams.append('filter_status', params.filter_status);
    if (params.filter_account) queryParams.append('filter_account', params.filter_account);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);

    const queryString = queryParams.toString();
    const url = `${API_URL}/reports/export${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url);

    if (!response.ok) {
        // Попытка прочитать ошибку как текст или JSON
        let errorMessage = `Failed to export reports: ${response.statusText}`;
        try {
             const errorData = await response.json();
             errorMessage = errorData.message || errorMessage;
        } catch (e) {
            try {
                 const errorText = await response.text();
                 errorMessage = errorText || errorMessage;
            } catch (e2) { /* Ignore */ }
        }
        throw new Error(errorMessage);
    }

    // Возвращаем тело ответа как Blob
    return await response.blob();
}; 