import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { getAPIClient } from '../lib/api-client';
import { formatDate, truncate } from '../lib/utils';
import type { Channel, ChannelFilters, CreateChannelRequest, ChannelEnrichment } from '../types/api';
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
import { ChannelEnrichmentDetails } from '../components/ChannelEnrichmentDetails';

const ITEMS_PER_PAGE = 20;

/**
 * Channels list and management page
 */
export function Channels() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ChannelFilters>({
    limit: ITEMS_PER_PAGE,
    offset: 0,
  });
  const [searchTitle, setSearchTitle] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [addMode, setAddMode] = useState<'url' | 'manual'>('url');
  const [urlFormData, setUrlFormData] = useState({
    url: '',
    callback_url: '',
  });
  const [formData, setFormData] = useState<CreateChannelRequest>({
    channel_id: '',
    title: '',
    channel_url: '',
  });

  // Store enrichments for expanded rows
  const [enrichments, setEnrichments] = useState<Record<string, ChannelEnrichment | null>>({});
  const [loadingEnrichments, setLoadingEnrichments] = useState<Set<string>>(new Set());

  // Fetch channels
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['channels', filters],
    queryFn: () => getAPIClient().getChannels(filters),
  });

  // Create channel mutation (manual mode)
  const createMutation = useMutation({
    mutationFn: (data: CreateChannelRequest) => getAPIClient().createChannel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      setShowCreateForm(false);
      setFormData({
        channel_id: '',
        title: '',
        channel_url: '',
      });
    },
  });

  // Create channel from URL mutation
  const createFromURLMutation = useMutation({
    mutationFn: (data: { url: string; callback_url?: string }) =>
      getAPIClient().createChannelFromURL(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      setShowCreateForm(false);
      setUrlFormData({
        url: '',
        callback_url: '',
      });
    },
  });

  // Delete channel mutation
  const deleteMutation = useMutation({
    mutationFn: (channelId: string) => getAPIClient().deleteChannel(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });

  const handleSearch = () => {
    const newFilters: ChannelFilters = {
      limit: ITEMS_PER_PAGE,
      offset: 0,
    };

    if (searchTitle) newFilters.title = searchTitle;

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

  const handleDelete = useCallback((channelId: string, title: string) => {
    if (confirm(`Are you sure you want to delete channel "${title}"?`)) {
      deleteMutation.mutate(channelId);
    }
  }, [deleteMutation]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (addMode === 'url') {
      createFromURLMutation.mutate(urlFormData);
    } else {
      createMutation.mutate(formData);
    }
  };

  // Fetch enrichment when row is expanded
  const fetchEnrichment = async (channelId: string) => {
    if (enrichments[channelId] !== undefined || loadingEnrichments.has(channelId)) {
      return; // Already loaded or loading
    }

    setLoadingEnrichments((prev) => new Set(prev).add(channelId));
    try {
      const enrichment = await getAPIClient().getChannelEnrichment(channelId);
      setEnrichments((prev) => ({ ...prev, [channelId]: enrichment }));
    } catch (error) {
      console.error('Failed to fetch enrichment:', error);
      setEnrichments((prev) => ({ ...prev, [channelId]: null }));
    } finally {
      setLoadingEnrichments((prev) => {
        const next = new Set(prev);
        next.delete(channelId);
        return next;
      });
    }
  };

  // Define columns with TanStack Table
  const columns = useMemo<ColumnDef<Channel>[]>(
    () => [
      {
        id: 'expander',
        header: '',
        cell: ({ row }) => <ExpandToggleButton row={row} />,
        enableHiding: false,
        enableSorting: false,
      },
      {
        accessorKey: 'channel_id',
        header: 'Channel ID',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{truncate(row.original.channel_id, 20)}</span>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <span className="font-medium">{truncate(row.original.title, 40)}</span>
        ),
      },
      {
        accessorKey: 'channel_url',
        header: 'Channel URL',
        cell: ({ row }) => (
          <a
            href={row.original.channel_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline max-w-xs inline-block"
          >
            {truncate(row.original.channel_url, 40)}
          </a>
        ),
      },
      {
        accessorKey: 'first_seen_at',
        header: 'First Seen',
        cell: ({ row }) => <span className="text-xs">{formatDate(row.original.first_seen_at)}</span>,
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
        accessorKey: 'created_at',
        header: 'Created At',
        cell: ({ row }) => <span className="text-xs">{formatDate(row.original.created_at)}</span>,
        enableSorting: true,
      },
      {
        accessorKey: 'updated_at',
        header: 'Updated At',
        cell: ({ row }) => <span className="text-xs">{formatDate(row.original.updated_at)}</span>,
        enableSorting: true,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDelete(row.original.channel_id, row.original.title)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        ),
        enableHiding: false,
        enableSorting: false,
      },
    ],
    [deleteMutation.isPending, handleDelete]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Channels</h1>
          <p className="text-muted-foreground">
            Manage YouTube channels tracked by your system
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4" />
            Add Channel
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Channel</CardTitle>
            <CardDescription>
              Add a channel by URL or enter channel details manually
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              {/* Mode Toggle */}
              <div className="flex gap-2 border-b pb-4">
                <Button
                  type="button"
                  variant={addMode === 'url' ? 'default' : 'outline'}
                  onClick={() => setAddMode('url')}
                  className="flex-1"
                >
                  By URL
                </Button>
                <Button
                  type="button"
                  variant={addMode === 'manual' ? 'default' : 'outline'}
                  onClick={() => setAddMode('manual')}
                  className="flex-1"
                >
                  Manual Entry
                </Button>
              </div>

              {/* URL Mode Form */}
              {addMode === 'url' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="youtube_url">YouTube Channel URL *</Label>
                    <Input
                      id="youtube_url"
                      value={urlFormData.url}
                      onChange={(e) =>
                        setUrlFormData({ ...urlFormData, url: e.target.value })
                      }
                      placeholder="https://www.youtube.com/@mikeokay"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports @handle, /channel/, /c/, and /user/ formats
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="callback_url">Callback URL (Optional)</Label>
                    <Input
                      id="callback_url"
                      value={urlFormData.callback_url}
                      onChange={(e) =>
                        setUrlFormData({ ...urlFormData, callback_url: e.target.value })
                      }
                      placeholder="https://your-domain.com/webhook"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Auto-creates PubSubHubbub subscription if provided
                    </p>
                  </div>
                </div>
              )}

              {/* Manual Mode Form */}
              {addMode === 'manual' && (
                <div className="grid gap-4 md:grid-cols-2">
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
                  <div>
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
                    <Label htmlFor="channel_url">Channel URL *</Label>
                    <Input
                      id="channel_url"
                      value={formData.channel_url}
                      onChange={(e) =>
                        setFormData({ ...formData, channel_url: e.target.value })
                      }
                      placeholder="https://www.youtube.com/channel/..."
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={
                    addMode === 'url'
                      ? createFromURLMutation.isPending
                      : createMutation.isPending
                  }
                >
                  {addMode === 'url'
                    ? createFromURLMutation.isPending
                      ? 'Resolving...'
                      : 'Add Channel'
                    : createMutation.isPending
                    ? 'Creating...'
                    : 'Create Channel'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
              {addMode === 'url' && createFromURLMutation.error && (
                <ErrorMessage message={(createFromURLMutation.error as Error).message} />
              )}
              {addMode === 'manual' && createMutation.error && (
                <ErrorMessage message={(createMutation.error as Error).message} />
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by channel title..."
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
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
              storageKey="channels-table"
              getRowCanExpand={() => true}
              renderExpandedRow={(row) => {
                const channelId = row.original.channel_id;

                // Fetch enrichment on first expand
                if (!enrichments[channelId] && !loadingEnrichments.has(channelId)) {
                  fetchEnrichment(channelId);
                }

                const enrichment = enrichments[channelId];
                const isLoading = loadingEnrichments.has(channelId);

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
                      No enrichment data available for this channel
                    </div>
                  );
                }

                return <ChannelEnrichmentDetails enrichment={enrichment} />;
              }}
              initialColumnVisibility={{
                created_at: false, // Hide by default
                updated_at: false, // Hide by default
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
            No channels found. Add a channel to get started.
          </div>
        )}
      </div>
    </div>
  );
}
