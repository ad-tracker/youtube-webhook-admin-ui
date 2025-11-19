import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, RefreshCw, Search, X } from 'lucide-react';
import { getAPIClient } from '../lib/api-client';
import { formatDate, truncate } from '../lib/utils';
import type { WebhookEventFilters } from '../types/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { Pagination } from '../components/Pagination';

const ITEMS_PER_PAGE = 20;

/**
 * Webhook Events list page with filtering and pagination
 */
export function WebhookEvents() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<WebhookEventFilters>({
    limit: ITEMS_PER_PAGE,
    offset: 0,
  });
  const [searchVideo, setSearchVideo] = useState('');
  const [searchChannel, setSearchChannel] = useState('');
  const [processedFilter, setProcessedFilter] = useState<string>('all');

  // Fetch webhook events
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['webhook-events', filters],
    queryFn: () => getAPIClient().getWebhookEvents(filters),
  });

  // Update webhook event mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, processed }: { id: number; processed: boolean }) =>
      getAPIClient().updateWebhookEvent(id, { processed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-events'] });
    },
  });

  const handleSearch = () => {
    const newFilters: WebhookEventFilters = {
      limit: ITEMS_PER_PAGE,
      offset: 0,
    };

    if (searchVideo) newFilters.video_id = searchVideo;
    if (searchChannel) newFilters.channel_id = searchChannel;
    if (processedFilter !== 'all') {
      newFilters.processed = processedFilter === 'true';
    }

    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFilters((prev) => ({
      ...prev,
      offset: (page - 1) * ITEMS_PER_PAGE,
    }));
  };

  const handleToggleProcessed = (id: number, currentStatus: boolean) => {
    updateMutation.mutate({ id, processed: !currentStatus });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhook Events</h1>
          <p className="text-muted-foreground">
            View and manage incoming webhook events
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Video ID</label>
            <Input
              placeholder="Filter by video ID..."
              value={searchVideo}
              onChange={(e) => setSearchVideo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Channel ID</label>
            <Input
              placeholder="Filter by channel ID..."
              value={searchChannel}
              onChange={(e) => setSearchChannel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Status</label>
            <Select
              value={processedFilter}
              onChange={(e) => setProcessedFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="true">Processed</option>
              <option value="false">Unprocessed</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleSearch} className="w-full">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-lg border bg-white shadow-sm">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={(error as Error).message} />
        ) : data && data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Video ID</TableHead>
                  <TableHead>Channel ID</TableHead>
                  <TableHead>Received At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Processing Error</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-mono text-xs">
                      {String(event.id)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {event.video_id || 'N/A'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {event.channel_id || 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDate(event.received_at)}
                    </TableCell>
                    <TableCell>
                      {event.processed ? (
                        <Badge variant="success">
                          <Check className="mr-1 h-3 w-3" />
                          Processed
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <X className="mr-1 h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs text-xs">
                      {event.processing_error ? (
                        <span className="text-red-600" title={event.processing_error}>
                          {truncate(event.processing_error, 30)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleToggleProcessed(event.id, event.processed)
                        }
                        disabled={updateMutation.isPending}
                      >
                        Mark as {event.processed ? 'Unprocessed' : 'Processed'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              currentPage={currentPage}
              totalItems={data.total}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No webhook events found. Try adjusting your filters.
          </div>
        )}
      </div>
    </div>
  );
}
