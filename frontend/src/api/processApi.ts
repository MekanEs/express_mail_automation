import {
    ProcessRequestBody,
    StartProcessResponse,

} from "../types/types";
import { handleApiResponse } from "../utils/apiUtils";
import { BASE_API } from "./constants";

// Базовый URL API (можно вынести в переменные окружения)
const API_URL = BASE_API;  // Предполагаем, что Vite настроен на проксирование

/**
 * Запуск нового процесса обработки
 * @param processData - Данные для запуска процесса
 * @returns Promise с ID запущенного процесса
 */
export const startProcess = async (processData: ProcessRequestBody): Promise<StartProcessResponse> => {
    const response = await fetch(`${API_URL}/process`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(processData),
    });
    const checkedResponse = await handleApiResponse(response);
    return await checkedResponse.json();
};

