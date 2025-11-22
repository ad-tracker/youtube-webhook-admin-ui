import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Search, Trash2, Sparkles } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { getAPIClient } from '../lib/api-client';
import { formatDate, truncate } from '../lib/utils';
import type { Channel, ChannelFilters, CreateChannelRequest, ChannelEnrichment, VideoSponsorDetail } from '../types/api';
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
  });
  const [formData, setFormData] = useState<CreateChannelRequest>({
    channel_id: '',
    title: '',
    channel_url: '',
  });

  // Store enrichments for expanded rows
  const [enrichments, setEnrichments] = useState<Record<string, ChannelEnrichment | null>>({});
  const [loadingEnrichments, setLoadingEnrichments] = useState<Set<string>>(new Set());

  // Store sponsors for expanded rows
  const [sponsors, setSponsors] = useState<Record<string, VideoSponsorDetail[]>>({});
  const [loadingSponsors, setLoadingSponsors] = useState<Set<string>>(new Set());

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
    mutationFn: (data: { url: string }) =>
      getAPIClient().createChannelFromURL(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      setShowCreateForm(false);
      setUrlFormData({
        url: '',
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

  const enrichMutation = useMutation({
    mutationFn: (channelId: string) => getAPIClient().enqueueChannelEnrichment(channelId),
    onSuccess: (_data, channelId) => {
      // Invalidate the enrichment data for this channel to trigger a refetch
      setEnrichments((prev) => {
        const updated = { ...prev };
        delete updated[channelId];
        return updated;
      });
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

  const handleEnrich = useCallback((channelId: string, title: string) => {
    if (confirm(`Queue enrichment data pull for channel "${title}"?`)) {
      enrichMutation.mutate(channelId);
    }
  }, [enrichMutation]);

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

  // Fetch sponsors when row is expanded
  const fetchSponsors = async (channelId: string) => {
    if (sponsors[channelId] !== undefined || loadingSponsors.has(channelId)) {
      return; // Already loaded or loading
    }

    setLoadingSponsors((prev) => new Set(prev).add(channelId));
    try {
      const response = await getAPIClient().getChannelSponsors(channelId, { limit: 10 });
      setSponsors((prev) => ({ ...prev, [channelId]: response.items }));
    } catch (error) {
      console.error('Failed to fetch sponsors:', error);
      setSponsors((prev) => ({ ...prev, [channelId]: [] }));
    } finally {
      setLoadingSponsors((prev) => {
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
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEnrich(row.original.channel_id, row.original.title)}
              disabled={enrichMutation.isPending}
              title="Queue channel enrichment"
            >
              <Sparkles className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDelete(row.original.channel_id, row.original.title)}
              disabled={deleteMutation.isPending}
              title="Delete channel"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ),
        enableHiding: false,
        enableSorting: false,
      },
    ],
    [deleteMutation.isPending, enrichMutation.isPending, handleDelete, handleEnrich]
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

                // Fetch enrichment and sponsors on first expand
                if (!enrichments[channelId] && !loadingEnrichments.has(channelId)) {
                  fetchEnrichment(channelId);
                }
                if (!sponsors[channelId] && !loadingSponsors.has(channelId)) {
                  fetchSponsors(channelId);
                }

                const enrichment = enrichments[channelId];
                const channelSponsors = sponsors[channelId];
                const isLoadingEnrichment = loadingEnrichments.has(channelId);
                const isLoadingSponsors = loadingSponsors.has(channelId);

                // Calculate sponsor analytics (without useMemo to avoid React Hooks rule violation)
                const getSponsorAnalytics = () => {
                  if (!channelSponsors || channelSponsors.length === 0) return [];

                  const sponsorMap = new Map<string, { sponsor: VideoSponsorDetail; count: number; videos: VideoSponsorDetail[] }>();

                  channelSponsors.forEach((detail) => {
                    const existing = sponsorMap.get(detail.sponsor_id);
                    if (existing) {
                      existing.count++;
                      existing.videos.push(detail);
                    } else {
                      sponsorMap.set(detail.sponsor_id, {
                        sponsor: detail,
                        count: 1,
                        videos: [detail],
                      });
                    }
                  });

                  return Array.from(sponsorMap.values())
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10); // Top 10
                };
                const sponsorAnalytics = getSponsorAnalytics();

                return (
                  <div className="space-y-6">
                    {/* Enrichment Data */}
                    {isLoadingEnrichment ? (
                      <div className="p-4">
                        <LoadingSpinner />
                      </div>
                    ) : enrichment ? (
                      <ChannelEnrichmentDetails enrichment={enrichment} />
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No enrichment data available for this channel
                      </div>
                    )}

                    {/* Sponsor Partnerships Section */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-sm mb-3">Sponsor Partnerships</h4>
                      {isLoadingSponsors ? (
                        <div className="flex justify-center py-4">
                          <LoadingSpinner />
                        </div>
                      ) : sponsorAnalytics.length > 0 ? (
                        <div className="space-y-3">
                          {sponsorAnalytics.map(({ sponsor, count, videos }) => {
                            const firstDetected = videos[videos.length - 1]?.first_detected_at;
                            const lastDetected = videos[0]?.first_detected_at;

                            return (
                              <div
                                key={sponsor.sponsor_id}
                                className="bg-white p-3 rounded border border-gray-200"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <Link
                                      to={`/sponsors/${sponsor.sponsor_id}`}
                                      className="font-medium text-blue-600 hover:underline"
                                    >
                                      {sponsor.sponsor_name}
                                    </Link>
                                    {sponsor.sponsor_category && (
                                      <span className="ml-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                        {sponsor.sponsor_category}
                                      </span>
                                    )}
                                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                      <span>{count} video{count === 1 ? '' : 's'}</span>
                                      {firstDetected && lastDetected && (
                                        <span>
                                          {formatDate(firstDetected)} - {formatDate(lastDetected)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-semibold">{count}</div>
                                    <div className="text-xs text-muted-foreground">
                                      video{count === 1 ? '' : 's'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No sponsor partnerships detected for this channel</p>
                      )}
                    </div>
                  </div>
                );
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
