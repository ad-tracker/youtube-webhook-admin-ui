import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Search } from 'lucide-react';
import { getAPIClient } from '../lib/api-client';
import { formatDate, truncate } from '../lib/utils';
import type { VideoUpdateFilters } from '../types/api';
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
 * Video Updates audit trail page
 */
export function VideoUpdates() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<VideoUpdateFilters>({
    limit: ITEMS_PER_PAGE,
    offset: 0,
  });
  const [searchVideo, setSearchVideo] = useState('');
  const [searchChannel, setSearchChannel] = useState('');
  const [updateType, setUpdateType] = useState<string>('all');

  // Fetch video updates
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['video-updates', filters],
    queryFn: () => getAPIClient().getVideoUpdates(filters),
  });

  const handleSearch = () => {
    const newFilters: VideoUpdateFilters = {
      limit: ITEMS_PER_PAGE,
      offset: 0,
    };

    if (searchVideo) newFilters.video_id = searchVideo;
    if (searchChannel) newFilters.channel_id = searchChannel;
    if (updateType !== 'all') {
      newFilters.update_type = updateType as 'new' | 'update' | 'delete';
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

  const getUpdateTypeBadge = (type: string) => {
    switch (type) {
      case 'new':
        return <Badge variant="success">New</Badge>;
      case 'update':
        return <Badge variant="default">Update</Badge>;
      case 'delete':
        return <Badge variant="destructive">Delete</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Video Updates</h1>
          <p className="text-muted-foreground">
            Audit trail of all video changes and updates
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
            <label className="mb-2 block text-sm font-medium">Update Type</label>
            <Select
              value={updateType}
              onChange={(e) => setUpdateType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="new">New</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
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
                  <TableHead>Type</TableHead>
                  <TableHead>Video ID</TableHead>
                  <TableHead>Channel ID</TableHead>
                  <TableHead>Webhook Event</TableHead>
                  <TableHead>Detected At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((update) => (
                  <TableRow key={update.id}>
                    <TableCell className="font-mono text-xs">
                      {update.id}
                    </TableCell>
                    <TableCell>{getUpdateTypeBadge(update.update_type)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {truncate(update.video_id, 20)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {truncate(update.channel_id, 20)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {update.webhook_event_id || 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDate(update.detected_at)}
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
            No video updates found. Try adjusting your filters.
          </div>
        )}
      </div>
    </div>
  );
}
