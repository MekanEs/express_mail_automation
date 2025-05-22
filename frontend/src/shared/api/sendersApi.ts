import { BASE_API } from "./constants";
import { handleApiResponse } from "../utils/apiUtils";
import { FromEmail } from "../../types/types";

const API_URL = BASE_API

/**
 * Получение списка email адресов отправителей.
 * @returns Promise с массивом объектов FromEmail.
 */
export const getFromEmails = async (): Promise<FromEmail[]> => {
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
