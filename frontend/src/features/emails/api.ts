import { from_email } from "../../types/types";
import { BASE_API } from "../../shared/api/constants";
import { handleApiResponse } from "../../shared/utils/apiUtils";

const API_URL = BASE_API;

export const getEmails = async (): Promise<from_email[]> => {
  const response = await fetch(`${API_URL}/fromEmails`, {
    method: 'GET'
  });
  const checkedResponse = await handleApiResponse(response);
  const data = await checkedResponse.json();

  if (data && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'data')) {
    if (data.error) {
      console.error("API error fetching emails:", data.error);
      throw new Error(data.error.message || 'Failed to fetch emails');
    }
    return data.data || [];
  }
  else if (Array.isArray(data)) {
    return data;
  }
  console.warn("Unexpected response format for emails:", data);
  return [];
};

export const addEmail = async (email: string): Promise<void> => {
  const res = await fetch(`${API_URL}/fromEmails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  });
  await handleApiResponse(res);
};

export const deleteEmail = async (id: number): Promise<void> => {
  const res = await fetch(`${API_URL}/fromEmails`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id })
  });
  await handleApiResponse(res);
};
