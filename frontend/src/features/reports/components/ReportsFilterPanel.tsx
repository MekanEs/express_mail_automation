import React from 'react';
import { ReportPageFilters } from '../../../types/types';

// Определяем тип для фильтров, которые мы передаем
// Исключаем параметры пагинации и сортировки, так как они управляются в ReportsPage
// type ReportFilters = Omit<GetReportsParams, 'page' | 'limit' | 'sort_by' | 'sort_order'>;

interface ActiveFilter {
    key: keyof ReportPageFilters;
    value: string | number | undefined;
}

interface ReportsFilterPanelProps {
    filters: ReportPageFilters;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    activeFilters: ActiveFilter[];
    onClearFilter: (filterName: keyof ReportPageFilters) => void;
    onClearAllFilters: () => void;
}

export const ReportsFilterPanel: React.FC<ReportsFilterPanelProps> = ({
    filters,
    onFilterChange,
    activeFilters,
    onClearFilter,
    onClearAllFilters,
}) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                {/* Фильтр по статусу */}
                <div>
                    <label htmlFor="filter_status" className="block text-sm font-medium text-gray-700">Статус</label>
                    <select
                        id="filter_status"
                        name="filter_status"
                        value={filters.filter_status || ''}
                        onChange={onFilterChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="">Все</option>
                        <option value="success">Успешно</option>
                        <option value="failure">Ошибка</option>
                        <option value="partial_failure">Частичная ошибка</option>
                    </select>
                </div>

                {/* Фильтр по аккаунту */}
                <div>
                    <label htmlFor="filter_account" className="block text-sm font-medium text-gray-700">Аккаунт</label>
                    <input
                        type="text"
                        id="filter_account"
                        name="filter_account"
                        value={filters.filter_account || ''}
                        onChange={onFilterChange}
                        placeholder="Введите email аккаунта..."
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>

                {/* Фильтр по ID процесса */}
                <div>
                    <label htmlFor="filter_process_id" className="block text-sm font-medium text-gray-700">ID Процесса</label>
                    <input
                        type="text"
                        id="filter_process_id"
                        name="filter_process_id"
                        value={filters.filter_process_id || ''}
                        onChange={onFilterChange}
                        placeholder="Введите ID процесса..."
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
            </div>

            {activeFilters.length > 0 && (
                <div className="p-3 bg-gray-100 rounded-md flex items-center flex-wrap gap-2">
                    <span className="text-sm font-medium text-gray-700">Активные фильтры:</span>
                    {activeFilters.map(({ key, value }) => (
                        <span key={key} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center">
                            {key.replace('filter_', '').replace('_', ' ')}: {String(value)}
                            <button
                                onClick={() => onClearFilter(key)}
                                className="ml-2 text-blue-700 hover:text-blue-900"
                                aria-label={`Очистить фильтр для ${key}`}
                            >
                                &times;
                            </button>
                        </span>
                    ))}
                    <button
                        onClick={onClearAllFilters}
                        className="ml-auto text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                        Очистить все фильтры
                    </button>
                </div>
            )}
        </div>
    );
};
