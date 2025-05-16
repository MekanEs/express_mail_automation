import { useState } from "react";
import { useDeleteReports, useDeleteEmptyReports } from "../../features/reports/hooks/useReportMutations";
import { ReportPageFilters } from "../../types/types";
import { PaginationComponent } from "../../components/common/Pagination";
import { ReportsTable } from "../../features/reports/components/ReportsTable";
import { ReportsFilterPanel } from "../../features/reports/components/ReportsFilterPanel";
import { useReports } from "../../features/reports/hooks/useReports";
import { ConfirmModal } from "../../components/common/ConfirmModal";

// Skeleton component for a single report group
const ReportGroupSkeleton = () => (
    <div className="bg-white rounded-lg p-4 shadow-md animate-pulse">
        <div className="flex justify-between items-center mb-3 border-b pb-2">
            <div>
                <div className="h-6 bg-gray-300 rounded w-3/4 mb-1"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
            <div className="h-6 bg-gray-300 rounded-full w-20"></div>
        </div>
        <div className="overflow-x-auto">
            <div className="h-8 bg-gray-300 rounded mb-2"></div> {/* Skeleton for table header */}
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded mb-1"></div> /* Skeleton for table row */
            ))}
        </div>
        <div className="flex justify-end mt-2">
            <div className="h-9 bg-gray-300 rounded w-24"></div> {/* Skeleton for delete button */}
        </div>
    </div>
);

export const ReportsPage = () => {
    const {
        isLoading,
        isError,
        error,
        isFetching,
        filters,
        sortBy,
        sortOrder,
        onlyFound,
        currentPage,
        displayData,
        pagination,
        hasReports,
        refetch,
        toggleOnlyFound,
        setCurrentPage,
        handleFilterChange,
        handleSortChange,
        setFilters,
    } = useReports();

    const { deleteReports, isDeleting } = useDeleteReports();
    const { deleteEmptyReports, isDeleting: isDeletingEmpty } = useDeleteEmptyReports();

    const [showDeleteEmptyConfirm, setShowDeleteEmptyConfirm] = useState(false);

    const renderLoadingState = () => {
        if (isFetching && !isLoading) return <div className='text-sm text-gray-500 p-2'>Fetching updates...</div>; // Or a more subtle loading indicator
        return (
            <div className="space-y-6">
                <ReportGroupSkeleton />
                <ReportGroupSkeleton />
            </div>
        );
    };

    const handleClearFilter = (filterName: keyof ReportPageFilters) => {
        setFilters((prev: ReportPageFilters) => ({
            ...prev,
            [filterName]: undefined
        }));
        setCurrentPage(1);
    };

    const handleClearAllFilters = () => {
        setFilters({});
        setCurrentPage(1);
    };

    const handleDeleteEmptyConfirm = () => {
        deleteEmptyReports();
        setShowDeleteEmptyConfirm(false);
    };

    const activeFilters = Object.entries(filters)
        .filter(([, value]) => value !== undefined && value !== '')
        .map(([key, value]) => ({ key: key as keyof ReportPageFilters, value }));

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Reports</h2>

            <div className="mb-6 p-4 bg-white rounded shadow-md space-y-4">
                <ReportsFilterPanel
                    filters={filters}
                    onFilterChange={handleFilterChange}
                />

                <div className="flex flex-wrap justify-between items-center gap-4 border-t pt-4 mt-4">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => refetch()}
                            className="btn btn-primary flex items-center"
                            disabled={isFetching}
                        >
                            {isFetching && <span className="spinner-sm mr-2"></span>}
                            {isFetching ? 'Refreshing...' : 'Refresh Reports'}
                        </button>
                        <button
                            onClick={toggleOnlyFound}
                            className="btn btn-secondary"
                        >
                            {onlyFound ? 'All' : 'Only with Found Emails'}
                        </button>
                        <button
                            onClick={() => setShowDeleteEmptyConfirm(true)}
                            disabled={isDeletingEmpty}
                            className="btn btn-warning ml-2 flex items-center"
                        >
                            {isDeletingEmpty && <span className="spinner-sm mr-2"></span>}
                            {isDeletingEmpty ? 'Deleting Empty...' : 'Delete Empty Reports'}
                        </button>
                    </div>
                </div>
            </div>

            {activeFilters.length > 0 && (
                <div className="mb-4 p-3 bg-gray-100 rounded-md flex items-center flex-wrap gap-2">
                    <span className="text-sm font-medium text-gray-700">Active Filters:</span>
                    {activeFilters.map(({ key, value }) => (
                        <span key={key} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center">
                            {key.replace('filter_', '').replace('_', ' ')}: {String(value)}
                            <button
                                onClick={() => handleClearFilter(key)}
                                className="ml-2 text-blue-700 hover:text-blue-900"
                                aria-label={`Clear filter for ${key}`}
                            >
                                &times;
                            </button>
                        </span>
                    ))}
                    <button
                        onClick={handleClearAllFilters}
                        className="ml-auto text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                        Clear All Filters
                    </button>
                </div>
            )}

            {isError && <div className="text-center p-4 text-red-600">Error loading reports: {error instanceof Error ? error.message : String(error)}</div>}

            {isLoading ? renderLoadingState() :
                !isError && (
                    <>
                        {!hasReports && displayData.length === 0 ? (
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

                        {pagination && pagination.pages > 1 && (
                            <PaginationComponent
                                currentPage={currentPage}
                                totalPages={pagination.pages}
                                totalItems={pagination.total}
                                itemsPerPage={pagination.limit}
                                onPageChange={setCurrentPage}
                            />
                        )}
                    </>
                )
            }

            {/* Confirm Delete Empty Reports Modal */}
            <ConfirmModal
                isOpen={showDeleteEmptyConfirm}
                title="Delete Empty Reports"
                message="Are you sure you want to delete all empty reports? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDeleteEmptyConfirm}
                onCancel={() => setShowDeleteEmptyConfirm(false)}
                isConfirmLoading={isDeletingEmpty}
            />
        </div>
    );
};
