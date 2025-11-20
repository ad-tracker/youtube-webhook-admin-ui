import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { getAPIClient } from '../lib/api-client';
import { formatDate, truncate } from '../lib/utils';
import type { Video, VideoFilters, CreateVideoRequest, VideoEnrichment, Channel } from '../types/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { DataTable, ExpandToggleButton } from '../components/ui/data-table';
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
import { VideoEnrichmentDetails } from '../components/VideoEnrichmentDetails';

const ITEMS_PER_PAGE = 20;

/**
 * Videos list and management page
 */
export function Videos() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<VideoFilters>({
    limit: ITEMS_PER_PAGE,
    offset: 0,
  });
  const [searchTitle, setSearchTitle] = useState('');
  const [searchChannel, setSearchChannel] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateVideoRequest>({
    video_id: '',
    channel_id: '',
    title: '',
    video_url: '',
    published_at: new Date().toISOString(),
  });

  // Store enrichments for expanded rows
  const [enrichments, setEnrichments] = useState<Record<string, VideoEnrichment | null>>({});
  const [loadingEnrichments, setLoadingEnrichments] = useState<Set<string>>(new Set());

  // Store channels for channel name display
  const [channels, setChannels] = useState<Record<string, Channel | null>>({});

  // Fetch videos
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['videos', filters],
    queryFn: () => getAPIClient().getVideos(filters),
  });

  // Fetch channels for all videos on the current page
  useQuery({
    queryKey: ['channels', data?.items],
    queryFn: async () => {
      if (!data?.items || data.items.length === 0) return {};

      // Extract unique channel IDs
      const channelIds = [...new Set(data.items.map((video) => video.channel_id))];

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

  // Create video mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateVideoRequest) => getAPIClient().createVideo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      setShowCreateForm(false);
      setFormData({
        video_id: '',
        channel_id: '',
        title: '',
        video_url: '',
        published_at: new Date().toISOString(),
      });
    },
  });

  // Delete video mutation
  const deleteMutation = useMutation({
    mutationFn: (videoId: string) => getAPIClient().deleteVideo(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });

  const handleSearch = () => {
    const newFilters: VideoFilters = {
      limit: ITEMS_PER_PAGE,
      offset: 0,
    };

    if (searchTitle) newFilters.title = searchTitle;
    if (searchChannel) newFilters.channel_id = searchChannel;

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

  const handleDelete = useCallback((videoId: string, title: string) => {
    if (confirm(`Are you sure you want to delete video "${title}"?`)) {
      deleteMutation.mutate(videoId);
    }
  }, [deleteMutation]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  // Fetch enrichment when row is expanded
  const fetchEnrichment = async (videoId: string) => {
    if (enrichments[videoId] !== undefined || loadingEnrichments.has(videoId)) {
      return; // Already loaded or loading
    }

    setLoadingEnrichments((prev) => new Set(prev).add(videoId));
    try {
      const enrichment = await getAPIClient().getVideoEnrichment(videoId);
      setEnrichments((prev) => ({ ...prev, [videoId]: enrichment }));
    } catch (error) {
      console.error('Failed to fetch enrichment:', error);
      setEnrichments((prev) => ({ ...prev, [videoId]: null }));
    } finally {
      setLoadingEnrichments((prev) => {
        const next = new Set(prev);
        next.delete(videoId);
        return next;
      });
    }
  };

  // Define columns with TanStack Table
  const columns = useMemo<ColumnDef<Video>[]>(
    () => [
      {
        id: 'expander',
        header: '',
        cell: ({ row }) => <ExpandToggleButton row={row} />,
        enableHiding: false,
        enableSorting: false,
      },
      {
        accessorKey: 'video_id',
        header: 'Video ID',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{truncate(row.original.video_id, 15)}</span>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <span className="max-w-xs font-medium">{truncate(row.original.title, 50)}</span>
        ),
      },
      {
        accessorKey: 'channel_id',
        header: 'Channel',
        cell: ({ row }) => {
          const channelId = row.original.channel_id;
          const channel = channels[channelId];
          const channelTitle = channel?.title;

          return channelTitle ? (
            <span className="text-sm">{truncate(channelTitle, 30)}</span>
          ) : (
            <span className="font-mono text-xs">{truncate(channelId, 15)}</span>
          );
        },
      },
      {
        accessorKey: 'video_url',
        header: 'Video URL',
        cell: ({ row }) => (
          <a
            href={row.original.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            {truncate(row.original.video_url, 30)}
          </a>
        ),
      },
      {
        accessorKey: 'published_at',
        header: 'Published',
        cell: ({ row }) => <span className="text-xs">{formatDate(row.original.published_at)}</span>,
        enableSorting: true,
      },
      {
        accessorKey: 'last_updated_at',
        header: 'Last Updated',
        cell: ({ row }) => (
          <span className="text-xs">{formatDate(row.original.last_updated_at)}</span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'first_seen_at',
        header: 'First Seen',
        cell: ({ row }) => <span className="text-xs">{formatDate(row.original.first_seen_at)}</span>,
        enableSorting: true,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDelete(row.original.video_id, row.original.title)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        ),
        enableHiding: false,
        enableSorting: false,
      },
    ],
    [deleteMutation.isPending, handleDelete, channels]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Videos</h1>
          <p className="text-muted-foreground">
            View and manage tracked YouTube videos
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4" />
            Add Video
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Video</CardTitle>
            <CardDescription>
              Enter the video information to start tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="video_id">Video ID *</Label>
                  <Input
                    id="video_id"
                    value={formData.video_id}
                    onChange={(e) =>
                      setFormData({ ...formData, video_id: e.target.value })
                    }
                    placeholder="e.g., dQw4w9WgXcQ"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="channel_id">Channel ID *</Label>
                  <Input
                    id="channel_id"
                    value={formData.channel_id}
                    onChange={(e) =>
                      setFormData({ ...formData, channel_id: e.target.value })
                    }
                    placeholder="UC..."
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="video_url">Video URL *</Label>
                  <Input
                    id="video_url"
                    value={formData.video_url}
                    onChange={(e) =>
                      setFormData({ ...formData, video_url: e.target.value })
                    }
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="published_at">Published Date *</Label>
                  <Input
                    id="published_at"
                    type="datetime-local"
                    value={formData.published_at.slice(0, 16)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        published_at: new Date(e.target.value).toISOString(),
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Video'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
              {createMutation.error && (
                <ErrorMessage message={(createMutation.error as Error).message} />
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Input
              placeholder="Search by title..."
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <Input
              placeholder="Filter by channel ID..."
              value={searchChannel}
              onChange={(e) => setSearchChannel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4" />
            Search
          </Button>
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
            <DataTable
              columns={columns}
              data={data.items}
              enableSorting={true}
              enableColumnVisibility={true}
              storageKey="videos-table"
              getRowCanExpand={() => true}
              renderExpandedRow={(row) => {
                const videoId = row.original.video_id;

                // Fetch enrichment on first expand
                if (!enrichments[videoId] && !loadingEnrichments.has(videoId)) {
                  fetchEnrichment(videoId);
                }

                const enrichment = enrichments[videoId];
                const isLoading = loadingEnrichments.has(videoId);

                if (isLoading) {
                  return (
                    <div className="p-4">
                      <LoadingSpinner />
                    </div>
                  );
                }

                if (!enrichment) {
                  return (
                    <div className="p-4 text-center text-gray-500">
                      No enrichment data available for this video
                    </div>
                  );
                }

                return <VideoEnrichmentDetails enrichment={enrichment} />;
              }}
              initialColumnVisibility={{
                first_seen_at: false, // Hide by default
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
            No videos found. Try adjusting your filters.
          </div>
        )}
      </div>
    </div>
  );
}
