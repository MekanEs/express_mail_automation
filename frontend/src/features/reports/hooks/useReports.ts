import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Report } from "../../../types/types";
import { getReports } from "../api";
import { useDeleteReports } from "./useReportMutations";

interface UseReportsOptions {
  initialOnlyFound?: boolean;
}

export const useReports = (options: UseReportsOptions = {}) => {
  // Состояние для фильтрации отображаемых отчетов
  const [onlyFound, setOnlyFound] = useState(options.initialOnlyFound ?? true);

  // Запрос для получения отчетов
  const {
    data: groupedReports = {} as Record<string, Report[]>,
    isFetching,
    refetch
  } = useQuery<Record<string, Report[]>, Error, Record<string, Report[]>>({
    queryKey: ['reports'],
    queryFn: async () => {
      const response = await getReports();
      // Группировка отчетов по processId
      return response.data.reduce((acc: Record<string, Report[]>, group) => {
        if (!acc[group.processId]) {
          acc[group.processId] = [];
        }
        acc[group.processId].push(...group.reports);
        return acc;
      }, {} as Record<string, Report[]>);
    }
  });

  // Мутация для удаления отчетов
  const { deleteReports, isDeleting } = useDeleteReports();

  // Проверка наличия отчетов
  const hasReports = groupedReports && Object.keys(groupedReports).length > 0;

  // Фильтрация отчетов по критерию наличия найденных писем
  const filteredReportEntries = useMemo(() => {
    return Object.entries(groupedReports)
      .map(([processId, items]: [string, Report[]]): [string, Report[]] => {
        const filteredItems = onlyFound
          ? items.filter(item => item.emails_found != null && item.emails_found > 0)
          : items;
        return [processId, filteredItems];
      })
      .filter(([, filteredItems]: [string, Report[]]) => filteredItems.length > 0);
  }, [groupedReports, onlyFound]);

  // Переключение фильтра "только с найденными письмами"
  const toggleOnlyFound = () => {
    setOnlyFound(prev => !prev);
  };

  return {
    filteredReportEntries,
    hasReports,
    isFetching,
    isDeleting,
    onlyFound,
    deleteReports,
    refetch,
    toggleOnlyFound
  };
};
