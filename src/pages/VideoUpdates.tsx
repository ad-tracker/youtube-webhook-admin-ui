import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Search } from 'lucide-react';
import { getAPIClient } from '../lib/api-client';
import { formatDate, truncate } from '../lib/utils';
import type { VideoUpdateFilters, Channel } from '../types/api';
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

  // Store channels for channel name display
  const [channels, setChannels] = useState<Record<string, Channel | null>>({});

  // Fetch video updates
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['video-updates', filters],
    queryFn: () => getAPIClient().getVideoUpdates(filters),
  });

  // Fetch channels for all video updates on the current page
  useQuery({
    queryKey: ['channels', data?.items],
    queryFn: async () => {
      if (!data?.items || data.items.length === 0) return {};

      // Extract unique channel IDs
      const channelIds = [...new Set(data.items.map((update) => update.channel_id))];

      // Fetch channels individually (no batch endpoint available)
      const channelMap: Record<string, Channel | null> = {};
      await Promise.all(
        channelIds.map(async (channelId) => {
          try {
            const channel = await getAPIClient().getChannelById(channelId);
            channelMap[channelId] = channel;
          } catch (error) {
            console.error(`Failed to fetch channel ${channelId}:`, error);
            channelMap[channelId] = null;
          }
        })
      );

      setChannels(channelMap);
      return channelMap;
    },
    enabled: !!data?.items,
  });

  const handleSearch = () => {
    const newFilters: VideoUpdateFilters = {
      limit: ITEMS_PER_PAGE,
      offset: 0,
    };

    if (searchVideo) newFilters.video_id = searchVideo;
    if (searchChannel) newFilters.channel_id = searchChannel;
    if (updateType !== 'all') {
      newFilters.update_type = updateType;
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
      case 'new_video':
        return <Badge variant="success">New Video</Badge>;
      case 'title_update':
        return <Badge variant="default">Title Update</Badge>;
      case 'description_update':
        return <Badge variant="default">Description Update</Badge>;
      case 'unknown':
        return <Badge variant="outline">Unknown</Badge>;
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
              <option value="new_video">New Video</option>
              <option value="title_update">Title Update</option>
              <option value="description_update">Description Update</option>
              <option value="unknown">Unknown</option>
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
                  <TableHead>Title</TableHead>
                  <TableHead>Video ID</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Webhook Event</TableHead>
                  <TableHead>Published At</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((update) => {
                  const channel = channels[update.channel_id];
                  const channelTitle = channel?.title;

                  return (
                    <TableRow key={update.id}>
                      <TableCell className="font-mono text-xs">
                        {update.id}
                      </TableCell>
                      <TableCell>{getUpdateTypeBadge(update.update_type)}</TableCell>
                      <TableCell className="max-w-xs">
                        {truncate(update.title, 40)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {truncate(update.video_id, 15)}
                      </TableCell>
                      <TableCell>
                        {channelTitle ? (
                          <span className="text-sm">{truncate(channelTitle, 30)}</span>
                        ) : (
                          <span className="font-mono text-xs">{truncate(update.channel_id, 15)}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {update.webhook_event_id}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatDate(update.published_at)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatDate(update.created_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
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
