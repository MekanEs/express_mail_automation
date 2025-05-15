import { DashboardMetrics } from "../../types/types";
import { handleApiResponse } from "../../shared/utils/apiUtils";
import { BASE_API } from "../../shared/api/constants";
import { Database } from "../../types/database.types";

const API_URL = BASE_API;

// Define types for sender aggregates
export type SenderAggregateRow = Database['public']['Tables']['sender_aggregates']['Row'];
export type SenderAggregateArchiveRow = Database['public']['Tables']['sender_aggregates_archive']['Row'];

/**
 * Получение метрик для дашборда
 * @returns Promise с данными для дашборда
 */
export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const response = await fetch(`${API_URL}/dashboard`);
  const checkedResponse = await handleApiResponse(response);
  return await checkedResponse.json();
};

/**
 * Получение агрегированных данных по отправителям
 * @returns Promise с агрегированными данными
 */
export const getSenderAggregates = async (): Promise<SenderAggregateRow[]> => {
  const url = `${API_URL}/reports/sender-aggregates`;
  const response = await fetch(url);
  const checkedResponse = await handleApiResponse(response);
  const data = await checkedResponse.json();
  return data.data || data;
};

/**
 * Получение архивных агрегированных данных по отправителям
 * @returns Promise с архивными агрегированными данными
 */
export const getSenderAggregatesArchive = async (): Promise<SenderAggregateArchiveRow[]> => {
  const url = `${API_URL}/reports/sender-aggregates-archive`;
  const response = await fetch(url);
  const checkedResponse = await handleApiResponse(response);
  const data = await checkedResponse.json();
  return data.data || data;
};

/**
 * Архивирование текущих агрегированных данных
 * @returns Promise с результатом архивирования
 */
export const archiveSenderAggregates = async (): Promise<{ message: string; count: number }> => {
  const url = `${API_URL}/admin/archive-sender-aggregates`;
  const response = await fetch(url, {
    method: 'POST',
  });
  const checkedResponse = await handleApiResponse(response);
  return await checkedResponse.json();
};
