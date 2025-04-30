import { from_email } from "../types/types";
import { handleApiResponse } from "../utils/apiUtils";

const API_URL = 'http://localhost:3003/api'

/**
 * Получение списка email адресов отправителей.
 * @returns Promise с массивом объектов from_email.
 */
export const getFromEmails = async (): Promise<from_email[]> => {
    const response = await fetch(`${API_URL}/fromEmails`); // Обращаемся к GET /api/from-emails
    const checkedResponse = await handleApiResponse(response);
    const data = await checkedResponse.json();

    // Проверяем, содержит ли ответ поле data (как от Supabase)
    if (data && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'data')) {
        if (data.error) {
            console.error("API error fetching sender emails:", data.error);
            throw new Error(data.error.message || 'Failed to fetch sender emails');
        }
        return data.data || [];
    }
    // Иначе считаем, что вернулся просто массив
    else if (Array.isArray(data)) {
        return data;
    }
    // Если формат неизвестен
    console.warn("Unexpected response format for sender emails:", data);
    return [];
};
