import { DashboardMetrics } from "../types/types";
import { handleApiResponse } from "../utils/apiUtils";

// Базовый URL API (можно вынести в переменные окружения)
const API_URL = 'http://localhost:3003/api' // Предполагаем, что Vite настроен на проксирование

/**
 * Получение метрик для дашборда
 * @returns Promise с данными для дашборда
 */
export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
    const response = await fetch(`${API_URL}/dashboard`);
    const checkedResponse = await handleApiResponse(response);
    return await checkedResponse.json();
};
