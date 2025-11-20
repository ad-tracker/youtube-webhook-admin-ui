import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldX, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { getAPIClient } from '../lib/api-client';
import { formatDate, truncate } from '../lib/utils';
import type { BlockedVideo, BlockedVideoFilters, CreateBlockedVideoRequest } from '../types/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { DataTable } from '../components/ui/data-table';
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

/**
 * Blocked Videos list and management page
 * Allows blocking specific video IDs to prevent webhook processing
 */
export function BlockedVideos() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<BlockedVideoFilters>({
    limit: ITEMS_PER_PAGE,
    offset: 0,
  });
  const [searchVideoId, setSearchVideoId] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateBlockedVideoRequest>({
    video_id: '',
    reason: '',
    created_by: '',
  });

  // Fetch blocked videos
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['blocked-videos', filters],
    queryFn: () => getAPIClient().getBlockedVideos(filters),
  });

  // Create blocked video mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateBlockedVideoRequest) => getAPIClient().createBlockedVideo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-videos'] });
      setShowCreateForm(false);
      setFormData({
        video_id: '',
        reason: '',
        created_by: '',
      });
    },
  });

  // Delete blocked video mutation
  const deleteMutation = useMutation({
    mutationFn: (videoId: string) => getAPIClient().deleteBlockedVideo(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-videos'] });
    },
  });

  const handleSearch = () => {
    const newFilters: BlockedVideoFilters = {
      limit: ITEMS_PER_PAGE,
      offset: 0,
    };

    if (searchVideoId) newFilters.video_id = searchVideoId;

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

  const handleDelete = useCallback((videoId: string) => {
    if (confirm(`Are you sure you want to unblock video "${videoId}"?`)) {
      deleteMutation.mutate(videoId);
    }
  }, [deleteMutation]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  // Define columns with TanStack Table
  const columns = useMemo<ColumnDef<BlockedVideo>[]>(
    () => [
      {
        accessorKey: 'video_id',
        header: 'Video ID',
        cell: ({ row }) => (
          <a
            href={`https://youtube.com/watch?v=${row.original.video_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            {row.original.video_id}
          </a>
        ),
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => (
          <span className="text-sm">{truncate(row.original.reason, 80)}</span>
        ),
      },
      {
        accessorKey: 'created_by',
        header: 'Created By',
        cell: ({ row }) => (
          <span className="text-sm">{row.original.created_by || '-'}</span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Created At',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.video_id)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        ),
        enableHiding: false,
        enableSorting: false,
      },
    ],
    [handleDelete, deleteMutation.isPending]
  );

  if (error) {
    return (
      <div className="p-8">
        <ErrorMessage
          title="Failed to load blocked videos"
          message={(error as Error).message}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blocked Videos</h1>
          <p className="text-muted-foreground">
            Manage videos that should be ignored by the webhook processor
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          variant={showCreateForm ? 'outline' : 'default'}
        >
          {showCreateForm ? (
            <>Cancel</>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Block Video
            </>
          )}
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Block a Video</CardTitle>
            <CardDescription>
              Add a video ID to the block list. Webhook events for this video will be rejected.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="video_id">
                    Video ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="video_id"
                    placeholder="BxV14h0kFs0"
                    value={formData.video_id}
                    onChange={(e) =>
                      setFormData({ ...formData, video_id: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="created_by">Created By (optional)</Label>
                  <Input
                    id="created_by"
                    placeholder="your.email@example.com"
                    value={formData.created_by}
                    onChange={(e) =>
                      setFormData({ ...formData, created_by: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Reason <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="reason"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Video title dynamically updates, causing excessive webhook events"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Blocking...' : 'Block Video'}
                </Button>
                {createMutation.error && (
                  <p className="text-sm text-destructive">
                    {(createMutation.error as Error).message}
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search-video-id">Video ID</Label>
              <Input
                id="search-video-id"
                placeholder="Filter by video ID..."
                value={searchVideoId}
                onChange={(e) => setSearchVideoId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
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
              <CardTitle>Blocked Videos</CardTitle>
              <CardDescription>
                {isLoading ? (
                  'Loading...'
                ) : (
                  <>
                    {data?.total ?? 0} blocked video{data?.total === 1 ? '' : 's'}
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
          ) : data?.data && data.data.length > 0 ? (
            <>
              <DataTable
                columns={columns}
                data={data.data}
                getRowCanExpand={() => false}
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
              <ShieldX className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold">No blocked videos</p>
              <p className="text-sm text-muted-foreground">
                No videos are currently blocked from webhook processing
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
