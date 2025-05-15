import {
  ProcessRequestBody,
  StartProcessResponse,
} from "../../types/types";
import { handleApiResponse } from "../../shared/utils/apiUtils";
import { BASE_API } from "../../shared/api/constants";

const API_URL = BASE_API;

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
