import { DashboardMetrics } from "../../types/types";
import { handleApiResponse } from "../../shared/utils/apiUtils";
import { BASE_API } from "../../shared/api/constants";

const API_URL = BASE_API;

/**
 * Получение метрик для дашборда
 * @returns Promise с данными для дашборда
 */
export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const response = await fetch(`${API_URL}/dashboard`);
  const checkedResponse = await handleApiResponse(response);
  return await checkedResponse.json();
};
