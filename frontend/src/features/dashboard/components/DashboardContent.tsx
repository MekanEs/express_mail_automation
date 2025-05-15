import React from 'react';
import { DashboardMetrics } from './DashboardMetrics';
import { SenderAggregatesTable } from './SenderAggregatesTable';

export const DashboardContent: React.FC = () => {
  return (
    <div className="dashboard-content">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p className="text-gray-600">Overview of system performance and statistics</p>
      </div>

      <DashboardMetrics />
      <SenderAggregatesTable />
    </div>
  );
};
