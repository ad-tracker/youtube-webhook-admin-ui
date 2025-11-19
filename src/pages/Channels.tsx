import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { getAPIClient } from '../lib/api-client';
import { formatDate, truncate } from '../lib/utils';
import type { ChannelFilters, CreateChannelRequest } from '../types/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
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

  const handleDelete = (channelId: string, title: string) => {
    if (confirm(`Are you sure you want to delete channel "${title}"?`)) {
      deleteMutation.mutate(channelId);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (addMode === 'url') {
      createFromURLMutation.mutate(urlFormData);
    } else {
      createMutation.mutate(formData);
    }
  };

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Channel URL</TableHead>
                  <TableHead>First Seen</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((channel) => (
                  <TableRow key={channel.channel_id}>
                    <TableCell className="font-mono text-xs">
                      {truncate(channel.channel_id, 20)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {truncate(channel.title, 40)}
                    </TableCell>
                    <TableCell className="max-w-xs text-xs text-muted-foreground">
                      <a
                        href={channel.channel_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {truncate(channel.channel_url, 40)}
                      </a>
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDate(channel.first_seen_at)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDate(channel.last_updated_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleDelete(channel.channel_id, channel.title)
                          }
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
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
            No channels found. Add a channel to get started.
          </div>
        )}
      </div>
    </div>
  );
}
