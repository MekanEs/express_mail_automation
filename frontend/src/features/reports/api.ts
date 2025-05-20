import {
  GetReportsParams,
  PaginatedReportsResponse,
} from "../../types/types";
import { BASE_API } from "../../shared/api/constants";
import { handleApiResponse } from "../../shared/utils/apiUtils";

const API_URL = BASE_API;

export const getReports = async (
  params: GetReportsParams = {}
): Promise<PaginatedReportsResponse> => {
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
  // Consider using handleApiResponse here as well after ensuring it fits this specific error handling
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `Failed to fetch reports: ${response.statusText}` }));
    throw new Error(errorData.message || `Failed to fetch reports: ${response.statusText}`);
  }
  return await response.json();
};

export type DeleteReportsParams = {
  process_id: string;
};

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
  // Consider using handleApiResponse
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `Failed to delete reports: ${response.statusText}` }));
    throw new Error(errorData.message || `Failed to delete reports: ${response.statusText}`);
  }
  // For DELETE, often no body is returned or just a success message.
  // If a specific JSON response is expected on success, parse it:
  // return await response.json();
  // Otherwise, if no content on success or not JSON:
  return; // Or handle as per actual API behavior
};

export const deleteEmptyReports = async (): Promise<void> => {
  const url = `${API_URL}/reports/delete-empty`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `Failed to delete empty reports: ${response.statusText}`
    }));
    throw new Error(errorData.message || `Failed to delete empty reports: ${response.statusText}`);
  }

  return;
};

export const deleteReportsBySenderApi = async (sender: string): Promise<{ message: string, deletedCount: number }> => {
  const url = `${API_URL}/reports/delete-by-sender`;
  const response = await fetch(url, {
    method: 'DELETE',
    body: JSON.stringify({ sender }),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `Failed to delete reports by sender: ${response.statusText}`
    }));
    throw new Error(errorData.message || `Failed to delete reports by sender: ${response.statusText}`);
  }
  return await response.json(); // Ожидаем ответ { message: string, deletedCount: number }
};

export const archiveSenderAggregates = async (): Promise<{ message: string, count?: number }> => {
  const response = await fetch(`${BASE_API}/admin/archive-sender-aggregates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const checkedResponse = await handleApiResponse(response);
  return await checkedResponse.json();
};
