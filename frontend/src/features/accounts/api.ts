import { Accounts, SelectableAccount } from '../../types/types'; // Adjusted path
import { handleApiResponse } from '../../shared/utils/apiUtils'; // Adjusted path
import { BASE_API } from '../../shared/api/constants'; // Adjusted path

const API_URL = BASE_API;

/**
 * Получение списка доступных аккаунтов.
 * @returns Promise с массивом аккаунтов.
 */
export const getAccounts = async (): Promise<SelectableAccount[]> => {
  const response = await fetch(`${API_URL}/accounts`);
  const checkedResponse = await handleApiResponse(response);
  const supabaseResponse = await checkedResponse.json();
  if (supabaseResponse.error) {
    console.error('Supabase error fetching accounts:', supabaseResponse.error);
    throw new Error(supabaseResponse.error.message || 'Failed to fetch accounts from Supabase');
  }
  return supabaseResponse.data || supabaseResponse || []; // Ensure data field is prioritized and fallback to empty array
};

export const checkAccounts = async (accountsToCheck: Accounts): Promise<string[]> => {
  const response = await fetch(`${API_URL}/checkAccounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ accounts: accountsToCheck })
  });
  const checkedResponse = await handleApiResponse(response);
  return await checkedResponse.json();
};
