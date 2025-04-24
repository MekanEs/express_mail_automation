/**
 * Вспомогательная функция для форматирования даты.
 * @param dateString - Строка с датой или null/undefined.
 * @returns Отформатированная строка или 'N/A'.
 */
export const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        // Используем стандартный Intl для большей гибкости или оставим toLocaleString
        return new Date(dateString).toLocaleString('ru-RU', {
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return dateString; // Возвращаем исходную строку в случае ошибки
    }
};

// Можно добавить другие форматтеры сюда 