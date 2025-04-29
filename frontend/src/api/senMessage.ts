
import { useMutation } from "@tanstack/react-query";
import { handleApiResponse } from "../utils/apiUtils";
import toast from "react-hot-toast";

// Базовый URL API (можно вынести в переменные окружения)
const API_URL = 'http://localhost:3003/api';  // Предполагаем, что Vite настроен на проксирование

/**
 * Запуск нового процесса обработки
 * @param processData - Данные для запуска процесса
 * @returns Promise с ID запущенного процесса
 */
type ResponseType = { success: boolean; message: string }
export const sendMessage = async (): Promise<ResponseType> => {
    const response = await fetch(`${API_URL}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },

    });
    const checkedResponse = await handleApiResponse(response);
    return await checkedResponse.json();
};

export const useSendMessage = () => {
    return useMutation<ResponseType, Error>({
        mutationFn: sendMessage,
        onSuccess: (data) => {
            toast.success(`Email sent successfully!`);
        },
        onError: (error) => {
            toast.error(`Failed to send email: ${error.message}`);
        },
    });
};
