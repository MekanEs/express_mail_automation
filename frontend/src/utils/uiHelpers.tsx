import React from 'react';

/**
 * Компонент для отображения статуса в виде цветного значка.
 * @param status - Строка статуса.
 */
export const StatusBadge: React.FC<{ status: string | null | undefined }> = ({ status }) => {
    let colorClasses = 'bg-gray-100 text-gray-800'; // Default
    const lowerStatus = status?.toLowerCase(); // Приводим к нижнему регистру для надежности

    if (lowerStatus === 'completed' || lowerStatus === 'success') {
        colorClasses = 'bg-green-100 text-green-800';
    } else if (lowerStatus === 'failed' || lowerStatus === 'failure') {
        colorClasses = 'bg-red-100 text-red-800';
    } else if (lowerStatus === 'in_progress') {
        colorClasses = 'bg-blue-100 text-blue-800 animate-pulse'; // Добавляем пульсацию для прогресса
    } else if (lowerStatus === 'partial_success' || lowerStatus === 'partial_failure') {
        colorClasses = 'bg-yellow-100 text-yellow-800';
    }

    return (
        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>
            {status || 'Unknown'}
        </span>
    );
};

// Сюда можно добавить другие UI хелперы
