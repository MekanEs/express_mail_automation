import React from 'react';
import { GetReportsParams } from '../../types/types';

// Определяем тип для фильтров, которые мы передаем
// Исключаем параметры пагинации и сортировки, так как они управляются в ReportsPage
type ReportFilters = Omit<GetReportsParams, 'page' | 'limit' | 'sort_by' | 'sort_order'>;

interface ReportsFilterPanelProps {
    filters: ReportFilters;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    // Можно добавить другие пропсы, если панель станет сложнее
}

export const ReportsFilterPanel: React.FC<ReportsFilterPanelProps> = ({
    filters,
    onFilterChange,
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Фильтр по статусу */}
            <div>
                <label htmlFor="filter_status" className="block text-sm font-medium text-gray-700">Status</label>
                <select
                    id="filter_status"
                    name="filter_status" // Имя должно совпадать с ключом в filters
                    value={filters.filter_status || ''}
                    onChange={onFilterChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                    <option value="">All</option>
                    <option value="success">Success</option>
                    <option value="failure">Failure</option>
                    <option value="partial_failure">Partial Failure</option>
                    <option value="in_progress">In Progress</option>
                </select>
            </div>
            
            {/* Фильтр по аккаунту */}
            <div>
                <label htmlFor="filter_account" className="block text-sm font-medium text-gray-700">Account</label>
                <input
                    type="text"
                    id="filter_account"
                    name="filter_account" // Имя должно совпадать с ключом в filters
                    value={filters.filter_account || ''}
                    onChange={onFilterChange}
                    placeholder="Enter account email..."
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>

            {/* Фильтр по ID процесса */}
            <div>
                <label htmlFor="filter_process_id" className="block text-sm font-medium text-gray-700">Process ID</label>
                <input
                    type="text"
                    id="filter_process_id"
                    name="filter_process_id" // Имя должно совпадать с ключом в filters
                    value={filters.filter_process_id || ''}
                    onChange={onFilterChange}
                    placeholder="Enter process ID..."
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
        </div>
    );
}; 