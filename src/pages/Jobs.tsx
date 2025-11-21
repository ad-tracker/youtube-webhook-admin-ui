import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { getAPIClient } from '../lib/api-client';
import { formatDate, truncate } from '../lib/utils';
import type { EnrichmentJob, EnrichmentJobFilters } from '../types/api';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { DataTable } from '../components/ui/data-table';
import { Badge } from '../components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { Pagination } from '../components/Pagination';

const ITEMS_PER_PAGE = 20;
const AUTO_REFRESH_INTERVAL = 10000; // 10 seconds

/**
 * Status badge component with appropriate colors
 */
function StatusBadge({ status }: { status: EnrichmentJob['status'] }) {
  const variants: Record<EnrichmentJob['status'], 'default' | 'secondary' | 'destructive' | 'outline' | 'success'> = {
    pending: 'secondary',
    processing: 'default',
    completed: 'success',
    failed: 'destructive',
    cancelled: 'outline',
  };

  return <Badge variant={variants[status]}>{status}</Badge>;
}

/**
 * Expandable error details component
 */
function ErrorDetails({ job }: { job: EnrichmentJob }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!job.error_message) {
    return <span className="text-gray-400">-</span>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm"
        >
          {isExpanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          <span className="font-medium">View Error</span>
        </button>
      </div>
      {isExpanded && (
        <div className="mt-2 space-y-3 bg-red-50 p-3 rounded-md border border-red-200">
          <div>
            <div className="text-xs font-semibold text-red-900 mb-1">Error Message:</div>
            <div className="text-xs text-red-800 font-mono whitespace-pre-wrap">
              {job.error_message}
            </div>
          </div>
          {job.error_stack_trace && (
            <div>
              <div className="text-xs font-semibold text-red-900 mb-1">Stack Trace:</div>
              <div className="text-xs text-red-700 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                {job.error_stack_trace}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Jobs list and monitoring page
 */
export function Jobs() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<EnrichmentJob['status'] | ''>('');
  const [filters, setFilters] = useState<EnrichmentJobFilters>({
    limit: ITEMS_PER_PAGE,
    offset: 0,
    order_by: 'created_at',
    order: 'desc',
  });

  // Auto-refresh for pending/processing jobs
  const shouldAutoRefresh = statusFilter === 'pending' || statusFilter === 'processing' || statusFilter === '';

  // Fetch jobs
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => getAPIClient().getJobs(filters),
    refetchInterval: shouldAutoRefresh ? AUTO_REFRESH_INTERVAL : false,
  });

  // Auto-refresh effect
  useEffect(() => {
    if (shouldAutoRefresh) {
      const interval = setInterval(() => {
        refetch();
      }, AUTO_REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [shouldAutoRefresh, refetch]);

  const handleStatusFilterChange = useCallback((status: EnrichmentJob['status'] | '') => {
    setStatusFilter(status);
    const newFilters: EnrichmentJobFilters = {
      limit: ITEMS_PER_PAGE,
      offset: 0,
      order_by: 'created_at',
      order: 'desc',
    };

    if (status) {
      newFilters.status = status;
    }

    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setFilters((prev) => ({
      ...prev,
      offset: (page - 1) * ITEMS_PER_PAGE,
    }));
  }, []);

  // Define columns with TanStack Table
  const columns = useMemo<ColumnDef<EnrichmentJob>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.id}</span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'job_type',
        header: 'Job Type',
        cell: ({ row }) => (
          <span className="text-sm">{row.original.job_type}</span>
        ),
      },
      {
        accessorKey: 'video_id',
        header: 'Video ID',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{truncate(row.original.video_id, 15)}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        enableSorting: true,
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ row }) => (
          <span className="text-sm">{row.original.priority}</span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'scheduled_at',
        header: 'Scheduled At',
        cell: ({ row }) => (
          <span className="text-xs">{formatDate(row.original.scheduled_at)}</span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'started_at',
        header: 'Started At',
        cell: ({ row }) => (
          <span className="text-xs">{formatDate(row.original.started_at)}</span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'completed_at',
        header: 'Completed At',
        cell: ({ row }) => (
          <span className="text-xs">{formatDate(row.original.completed_at)}</span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'attempts',
        header: 'Attempts',
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.attempts} / {row.original.max_attempts}
          </span>
        ),
      },
      {
        id: 'error',
        header: 'Error',
        cell: ({ row }) => <ErrorDetails job={row.original} />,
        enableSorting: false,
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enrichment Jobs</h1>
          <p className="text-muted-foreground">
            Monitor and track enrichment job queue status
            {shouldAutoRefresh && (
              <span className="ml-2 text-xs text-blue-600">
                (Auto-refreshing every 10 seconds)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter jobs by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-xs">
              <Label htmlFor="status-filter">Status</Label>
              <Select
                id="status-filter"
                value={statusFilter}
                onChange={(e) =>
                  handleStatusFilterChange(e.target.value as EnrichmentJob['status'] | '')
                }
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="rounded-lg border bg-white shadow-sm">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={(error as Error).message} />
        ) : data && data.items.length > 0 ? (
          <>
            <DataTable
              columns={columns}
              data={data.items}
              enableSorting={true}
              enableColumnVisibility={true}
              storageKey="jobs-table"
              initialColumnVisibility={{
                scheduled_at: false, // Hide by default
              }}
            />
            <Pagination
              currentPage={currentPage}
              totalItems={data.total}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No jobs found matching the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
