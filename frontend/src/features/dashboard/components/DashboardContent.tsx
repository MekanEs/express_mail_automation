import React from 'react';
import { DashboardMetrics } from './DashboardMetrics';
import { SenderAggregatesTable } from './SenderAggregatesTable';

export const DashboardContent: React.FC = () => {
  return (
    <div className="dashboard-content">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Панель управления</h1>
      </div>
      <SenderAggregatesTable />
      <DashboardMetrics />

    </div>
  );
};
