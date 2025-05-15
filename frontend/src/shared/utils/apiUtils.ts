/**
 * Общий обработчик ошибок для API запросов.
 * Проверяет response.ok и выбрасывает ошибку с сообщением из тела ответа или статус текстом.
 * @param response - Ответ от fetch.
 * @returns Исходный response, если он ok.
 * @throws Error - Если response не ok.
 */
export const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    // Пытаемся получить сообщение об ошибке из JSON тела
    const errorData = await response.json().catch(() => ({
      // Если тело не JSON или пустое, используем статус текст
      message: response.statusText
    }));
    // Выбрасываем ошибку с сообщением или стандартным текстом статуса
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  // Возвращаем исходный response для дальнейшей обработки (например, response.json())
  return response;
};

// Сюда можно добавить другие утилиты для API
