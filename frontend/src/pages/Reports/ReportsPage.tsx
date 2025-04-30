import { useQuery, } from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";
import { getReports, useDeleteReports, } from "../../api/reportsApi";
import { Report, ReportGroup, GetReportsParams, PaginatedReportsResponse, Pagination } from "../../types/types";
import { PaginationComponent } from "../../components/common/Pagination";
import { ReportsTable } from "../../components/reports/ReportsTable";
import { ReportsFilterPanel } from "../../components/reports/ReportsFilterPanel";




// Начальные данные для пагинации, чтобы избежать undefined
const initialPagination: Pagination = { page: 1, limit: 10, total: 0, pages: 0 };
const initialResponse: PaginatedReportsResponse = { data: [], pagination: initialPagination };

// Тип для фильтров, управляемых панелью
type ReportFiltersState = Omit<GetReportsParams, 'page' | 'limit' | 'sort_by' | 'sort_order'>;

export const ReportsPage = () => {
    // Состояние
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [filters, setFilters] = useState<ReportFiltersState>({});
    const [sortBy, setSortBy] = useState<string>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [onlyFound, setOnlyFound] = useState(true);

    const { deleteReports, isDeleting } = useDeleteReports();
    // Параметры запроса
    const queryParams: GetReportsParams = useMemo(() => ({
        page: currentPage,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...filters,
    }), [currentPage, limit, sortBy, sortOrder, filters]);

    // Запрос данных
    const {
        data: response = initialResponse,
        isLoading,
        isError,
        error,
        refetch,
        isFetching
    } = useQuery<PaginatedReportsResponse, Error>({
        queryKey: ['reports', queryParams],
        queryFn: () => getReports(queryParams),
        placeholderData: (previousData) => previousData,
    });



    // Локальная фильтрация
    const displayData: ReportGroup[] = useMemo(() => {
        if (!onlyFound || !response?.data) return response?.data ?? []; // Добавлена проверка на response.data

        return response.data
            .map((group: ReportGroup) => ({
                ...group,
                reports: group.reports.filter((item: Report) => item.emails_found != null && item.emails_found > 0),
            }))

    }, [response?.data, onlyFound]);

    // Обработчики
    const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value || undefined
        }));
        setCurrentPage(1);
    }, []);

    const handleSortChange = useCallback((newSortBy: string) => {
        // setSortBy(prevSortBy => {
        //     if (prevSortBy === newSortBy) {
        //         setSortOrder(prev => {
        //             console.log(prev)
        //             return prev === 'asc' ? 'desc' : 'asc'
        //         })
        //     }
        //     return newSortBy;
        // });
        if (newSortBy === sortBy) {
            setSortOrder(prev => {
                console.log(prev)
                return prev === 'asc' ? 'desc' : 'asc'
            })
        } else {
            setSortBy(newSortBy)
        }
        setCurrentPage(1);
    }, [sortBy]);

    // Рендеринг
    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Reports</h2>

            {/* Панель управления: Фильтры вынесены, кнопки остались */}
            <div className="mb-6 p-4 bg-white rounded shadow-md space-y-4">
                {/* Используем компонент панели фильтров */}
                <ReportsFilterPanel
                    filters={filters}
                    onFilterChange={handleFilterChange}
                />

                <div className="flex flex-wrap justify-between items-center gap-4 border-t pt-4 mt-4">
                    {/* Кнопки действий */}
                    <div className="flex space-x-2">
                        <button
                            onClick={() => refetch()}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            disabled={isFetching}
                        >
                            {isFetching ? 'Refreshing...' : 'Refresh Reports'}
                        </button>
                        <button
                            onClick={() => setOnlyFound(prev => !prev)}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {onlyFound ? 'All' : 'Only with Found Emails'}
                        </button>
                    </div>
                    {/* Кнопки экспорта */}

                </div>
            </div>

            {/* Отображение данных или состояний загрузки/ошибки */}
            {isLoading && <div className="text-center p-4">Loading reports...</div>}
            {isError && <div className="text-center p-4 text-red-600">Error loading reports: {error instanceof Error ? error.message : String(error)}</div>}

            {!isLoading && !isError && (
                <>
                    {displayData.length === 0 ? (
                        <div className="text-center p-4 bg-white rounded shadow">
                            No reports found matching your criteria.
                        </div>
                    ) : (
                        <ReportsTable
                            isDeleting={isDeleting}
                            deleteReports={deleteReports}
                            reportGroups={displayData}
                            sortBy={sortBy}
                            sortOrder={sortOrder}
                            onSortChange={handleSortChange}
                        />
                    )}

                    {/* Пагинация */}
                    {response?.pagination && response.pagination.pages > 1 && (
                        <PaginationComponent
                            currentPage={response.pagination.page}
                            totalPages={response.pagination.pages}
                            totalItems={response.pagination.total}
                            itemsPerPage={response.pagination.limit}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </>
            )}
        </div>
    );
};
