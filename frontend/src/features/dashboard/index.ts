// Export all dashboard components
export { DashboardContent } from './components/DashboardContent';
export { DashboardMetrics } from './components/DashboardMetrics';
export { SenderAggregatesTable } from './components/SenderAggregatesTable';

// Export all dashboard hooks
export { useDashboardMetrics } from './hooks/useDashboardMetrics';
export { useSenderAggregates } from './hooks/useSenderAggregates';

// Export all types from API
export type {
  SenderAggregateRow,
  SenderAggregateArchiveRow
} from './api';

// Re-export API functions
export {
  getDashboardMetrics,
  getSenderAggregates,
  getSenderAggregatesArchive,
  archiveSenderAggregates
} from './api';
