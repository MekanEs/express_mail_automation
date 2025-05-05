import { accounts, SelectableAccount } from '../types/types';
import { handleApiResponse } from '../utils/apiUtils';
import { BASE_API } from './constants';

const API_URL = BASE_API; // Используем относительный URL для прокси Vite

/**
 * Получение списка доступных аккаунтов.
 * @returns Promise с массивом аккаунтов.
 */
export const getAccounts = async (): Promise<SelectableAccount[]> => {
    const response = await fetch(`${API_URL}/accounts`);
    const checkedResponse = await handleApiResponse(response);
    // Бэкенд возвращает объект { data: account[], error: ... }
    const supabaseResponse = await checkedResponse.json();
    // Проверяем наличие ошибки от Supabase
    if (supabaseResponse.error) {
        console.error('Supabase error fetching accounts:', supabaseResponse.error);
        throw new Error(supabaseResponse.error.message || 'Failed to fetch accounts from Supabase');
    }

    // Возвращаем массив из поля data
    return supabaseResponse || [];
};

export const checkAccounts = async (accounts: accounts): Promise<string[]> => {
    const data = await fetch(`${API_URL}/checkAccounts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accounts })
    });
    // Предполагаем, что этот эндпоинт возвращает массив строк напрямую
    const checkedResponse = await handleApiResponse(data);
    return await checkedResponse.json();
};
