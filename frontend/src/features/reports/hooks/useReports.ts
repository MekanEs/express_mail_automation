import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";
import { getReports } from "../api";
import {
  Report,
  ReportGroup,
  GetReportsParams,
  PaginatedReportsResponse,
  Pagination,
  ReportPageFilters
} from "../../../types/types";
import { useDeleteReports } from "./useReportMutations";

const initialPagination: Pagination = { page: 1, limit: 10, total: 0, pages: 0 };
const initialResponse: PaginatedReportsResponse = { data: [], pagination: initialPagination };

interface UseReportsOptions {
  initialLimit?: number;
  initialSortBy?: string;
  initialSortOrder?: 'asc' | 'desc';
  initialOnlyFound?: boolean;
}

export const useReports = (options: UseReportsOptions = {}) => {
  const {
    initialLimit = 10,
    initialSortBy = 'created_at',
    initialSortOrder = 'desc',
    initialOnlyFound = true
  } = options;

  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(initialLimit);
  const [filters, setFilters] = useState<ReportPageFilters>({});
  const [sortBy, setSortBy] = useState<string>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);
  const [onlyFound, setOnlyFound] = useState(initialOnlyFound);

  const queryParams: GetReportsParams = useMemo(() => ({
    page: currentPage,
    limit,
    sort_by: sortBy,
    sort_order: sortOrder,
    ...filters,
  }), [currentPage, limit, sortBy, sortOrder, filters]);

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

  const displayData: ReportGroup[] = useMemo(() => {
    if (!response?.data) return [];
    if (!onlyFound) return response.data;

    return response.data
      .map((group: ReportGroup) => ({
        ...group,
        reports: group.reports.filter((item: Report) => item.emails_found != null && item.emails_found > 0),
      }))
      .filter(group => group.reports.length > 0);
  }, [response?.data, onlyFound]);

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value || undefined
    }));
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((newSortBy: string) => {
    if (newSortBy === sortBy) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  }, [sortBy, setSortBy, setSortOrder, setCurrentPage]);

  const toggleOnlyFound = useCallback(() => {
    setOnlyFound(prev => !prev);
  }, []);

  const pagination = response?.pagination ?? initialPagination;
  const hasReports = response && response.data && response.data.length > 0;

  // Мутация для удаления отчетов
  const { deleteReports, isDeleting } = useDeleteReports();

  return {
    isLoading,
    isError,
    error,
    isFetching,
    filters,
    setFilters,
    sortBy,
    sortOrder,
    onlyFound,
    currentPage,
    limit,
    displayData,
    pagination,
    hasReports,
    refetch,
    toggleOnlyFound,
    setCurrentPage,
    handleFilterChange,
    handleSortChange,
    isDeleting,
    deleteReports
  };
};
