import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Briefcase } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { getAPIClient } from '../lib/api-client';
import { formatDate, truncate } from '../lib/utils';
import type { SponsorDetectionJob, SponsorDetectionJobFilters } from '../types/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { DataTable, ExpandToggleButton } from '../components/ui/data-table';
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
function StatusBadge({ status }: { status: SponsorDetectionJob['status'] }) {
  const variants: Record<SponsorDetectionJob['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    completed: 'default',
    failed: 'destructive',
    skipped: 'outline',
  };

  const labels: Record<SponsorDetectionJob['status'], string> = {
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed',
    skipped: 'Skipped',
  };

  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

/**
 * Sponsor Detection Jobs list and monitoring page
 */
export function SponsorDetectionJobs() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<SponsorDetectionJob['status'] | ''>('');
  const [videoIdFilter, setVideoIdFilter] = useState('');
  const [filters, setFilters] = useState<SponsorDetectionJobFilters>({
    limit: ITEMS_PER_PAGE,
    offset: 0,
    order_by: 'created_at',
    order: 'desc',
  });

  // Auto-refresh for pending jobs
  const shouldAutoRefresh = statusFilter === 'pending' || statusFilter === '';

  // Fetch jobs
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sponsor-detection-jobs', filters],
    queryFn: () => getAPIClient().getSponsorDetectionJobs(filters),
    refetchInterval: shouldAutoRefresh ? AUTO_REFRESH_INTERVAL : false,
  });

  // Check if there are any pending jobs
  const hasPendingJobs = useMemo(() => {
    if (!data?.items) return false;
    return data.items.some((job) => job.status === 'pending');
  }, [data]);

  // Auto-refresh effect
  useEffect(() => {
    if (shouldAutoRefresh && hasPendingJobs) {
      const interval = setInterval(() => {
        refetch();
      }, AUTO_REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [shouldAutoRefresh, hasPendingJobs, refetch]);

  const handleSearch = () => {
    const newFilters: SponsorDetectionJobFilters = {
      limit: ITEMS_PER_PAGE,
      offset: 0,
      order_by: 'created_at',
      order: 'desc',
    };

    if (statusFilter) newFilters.status = statusFilter;
    if (videoIdFilter) newFilters.video_id = videoIdFilter;

    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = useCallback((status: SponsorDetectionJob['status'] | '') => {
    setStatusFilter(status);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setFilters((prev) => ({
      ...prev,
      offset: (page - 1) * ITEMS_PER_PAGE,
    }));
  }, []);

  const handleClearFilters = () => {
    setStatusFilter('');
    setVideoIdFilter('');
    setFilters({
      limit: ITEMS_PER_PAGE,
      offset: 0,
      order_by: 'created_at',
      order: 'desc',
    });
    setCurrentPage(1);
  };

  // Define columns with TanStack Table
  const columns = useMemo<ColumnDef<SponsorDetectionJob>[]>(
    () => [
      {
        id: 'expander',
        header: '',
        cell: ({ row }) => {
          // Only show expander if there's an error message
          return row.original.error_message ? <ExpandToggleButton row={row} /> : null;
        },
        enableHiding: false,
        enableSorting: false,
      },
      {
        accessorKey: 'id',
        header: 'Job ID',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{truncate(row.original.id, 12)}</span>
        ),
      },
      {
        accessorKey: 'video_id',
        header: 'Video ID',
        cell: ({ row }) => (
          <a
            href={`https://youtube.com/watch?v=${row.original.video_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-blue-600 hover:underline"
          >
            {truncate(row.original.video_id, 15)}
          </a>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        enableSorting: true,
      },
      {
        accessorKey: 'started_at',
        header: 'Started',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.started_at ? formatDate(row.original.started_at) : '-'}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'completed_at',
        header: 'Completed',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.completed_at ? formatDate(row.original.completed_at) : '-'}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.created_at)}
          </span>
        ),
        enableSorting: true,
      },
    ],
    []
  );

  if (error) {
    return (
      <div className="p-8">
        <ErrorMessage
          title="Failed to load sponsor detection jobs"
          message={(error as Error).message}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-8 w-8" />
            Sponsor Detection Jobs
          </h1>
          <p className="text-muted-foreground">
            Monitor sponsor detection processing jobs
            {hasPendingJobs && (
              <span className="ml-2 text-yellow-600 font-medium">
                (Auto-refreshing every 10s)
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value as SponsorDetectionJob['status'] | '')}
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="skipped">Skipped</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="video-id-filter">Video ID</Label>
                <Input
                  id="video-id-filter"
                  placeholder="Filter by video ID..."
                  value={videoIdFilter}
                  onChange={(e) => setVideoIdFilter(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSearch}>Search</Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detection Jobs</CardTitle>
              <CardDescription>
                {isLoading ? (
                  'Loading...'
                ) : (
                  <>
                    {data?.total ?? 0} job{data?.total === 1 ? '' : 's'}
                  </>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : data?.items && data.items.length > 0 ? (
            <>
              <DataTable
                columns={columns}
                data={data.items}
                enableSorting={true}
                storageKey="sponsor-detection-jobs-table"
                getRowCanExpand={(row) => !!row.original.error_message}
                renderExpandedRow={(row) => {
                  const job = row.original;

                  if (!job.error_message) {
                    return null;
                  }

                  return (
                    <div className="p-4 space-y-3 bg-red-50 border border-red-200">
                      <div>
                        <h4 className="text-sm font-semibold text-red-900 mb-2">Error Details</h4>
                        <div className="text-sm text-red-800 font-mono whitespace-pre-wrap bg-white p-3 rounded border border-red-200">
                          {job.error_message}
                        </div>
                      </div>
                      <dl className="grid gap-2 text-xs">
                        <div className="flex gap-2">
                          <dt className="font-medium text-red-900">Job ID:</dt>
                          <dd className="font-mono text-red-800">{job.id}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="font-medium text-red-900">Video ID:</dt>
                          <dd className="font-mono text-red-800">{job.video_id}</dd>
                        </div>
                        {job.started_at && (
                          <div className="flex gap-2">
                            <dt className="font-medium text-red-900">Started:</dt>
                            <dd className="text-red-800">{formatDate(job.started_at)}</dd>
                          </div>
                        )}
                        {job.completed_at && (
                          <div className="flex gap-2">
                            <dt className="font-medium text-red-900">Failed:</dt>
                            <dd className="text-red-800">{formatDate(job.completed_at)}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  );
                }}
              />
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalItems={data.total}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold">No jobs found</p>
              <p className="text-sm text-muted-foreground">
                {statusFilter || videoIdFilter
                  ? 'Try adjusting your filters'
                  : 'No sponsor detection jobs have been created yet'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
