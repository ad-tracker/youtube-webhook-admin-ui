import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { getAPIClient } from '../lib/api-client';
import { formatDate, truncate } from '../lib/utils';
import type { PubSubSubscription, PubSubSubscriptionFilters, CreatePubSubSubscriptionRequest } from '../types/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
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
 * PubSub Subscriptions management page
 */
export function Subscriptions() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<PubSubSubscriptionFilters>({
    limit: ITEMS_PER_PAGE,
    offset: 0,
  });
  const [searchChannel, setSearchChannel] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreatePubSubSubscriptionRequest>({
    channel_id: '',
    callback_url: '',
    lease_seconds: 432000, // 5 days default
  });

  // Fetch subscriptions
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscriptions', filters],
    queryFn: () => getAPIClient().getPubSubSubscriptions(filters),
  });

  // Create subscription mutation
  const createMutation = useMutation({
    mutationFn: (data: CreatePubSubSubscriptionRequest) =>
      getAPIClient().createPubSubSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setShowCreateForm(false);
      setFormData({
        channel_id: '',
        callback_url: '',
        lease_seconds: 432000,
      });
    },
  });

  // Delete subscription mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => getAPIClient().deletePubSubSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  const handleSearch = () => {
    const newFilters: PubSubSubscriptionFilters = {
      limit: ITEMS_PER_PAGE,
      offset: 0,
    };

    if (searchChannel) newFilters.channel_id = searchChannel;
    if (statusFilter !== 'all') {
      newFilters.status = statusFilter as 'pending' | 'active' | 'expired' | 'failed';
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

  const handleDelete = (id: number, channelId: string) => {
    if (confirm(`Are you sure you want to delete subscription for channel "${channelId}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Define columns with TanStack Table
  const columns = useMemo<ColumnDef<PubSubSubscription>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.id}</span>
        ),
      },
      {
        accessorKey: 'channel_id',
        header: 'Channel ID',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{truncate(row.original.channel_id, 20)}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        accessorKey: 'callback_url',
        header: 'Callback URL',
        cell: ({ row }) => (
          <span className="text-xs max-w-xs inline-block">{truncate(row.original.callback_url, 40)}</span>
        ),
      },
      {
        accessorKey: 'topic_url',
        header: 'Topic URL',
        cell: ({ row }) => (
          <a
            href={row.original.topic_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline max-w-xs inline-block"
          >
            {truncate(row.original.topic_url, 35)}
          </a>
        ),
      },
      {
        accessorKey: 'hub_url',
        header: 'Hub URL',
        cell: ({ row }) => (
          <span className="text-xs max-w-xs inline-block">{truncate(row.original.hub_url, 35)}</span>
        ),
      },
      {
        accessorKey: 'lease_seconds',
        header: 'Lease (sec)',
        cell: ({ row }) => (
          <span className="text-xs">{row.original.lease_seconds.toLocaleString()}</span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'secret',
        header: 'Secret',
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.original.secret ? truncate(row.original.secret, 12) : 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'last_verified_at',
        header: 'Last Verified',
        cell: ({ row }) => (
          <span className="text-xs">
            {row.original.last_verified_at ? formatDate(row.original.last_verified_at) : 'N/A'}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'expires_at',
        header: 'Expires At',
        cell: ({ row }) => (
          <span className="text-xs">{formatDate(row.original.expires_at)}</span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'created_at',
        header: 'Created At',
        cell: ({ row }) => (
          <span className="text-xs">{formatDate(row.original.created_at)}</span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'updated_at',
        header: 'Updated At',
        cell: ({ row }) => (
          <span className="text-xs">{formatDate(row.original.updated_at)}</span>
        ),
        enableSorting: true,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDelete(row.original.id, row.original.channel_id)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        ),
        enableHiding: false,
        enableSorting: false,
      },
    ],
    [deleteMutation.isPending]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PubSub Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage YouTube PubSubHubbub subscriptions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4" />
            Add Subscription
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Subscription</CardTitle>
            <CardDescription>
              Subscribe to YouTube PubSubHubbub notifications for a channel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="channel_id">Channel ID *</Label>
                  <Input
                    id="channel_id"
                    value={formData.channel_id}
                    onChange={(e) =>
                      setFormData({ ...formData, channel_id: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lease_seconds">Lease Seconds</Label>
                  <Input
                    id="lease_seconds"
                    type="number"
                    value={formData.lease_seconds}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lease_seconds: parseInt(e.target.value),
                      })
                    }
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Default: 432000 (5 days)
                  </p>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="callback_url">Callback URL *</Label>
                  <Input
                    id="callback_url"
                    type="url"
                    value={formData.callback_url}
                    onChange={(e) =>
                      setFormData({ ...formData, callback_url: e.target.value })
                    }
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    The URL where webhook notifications will be sent
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Subscription'}
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
              placeholder="Filter by channel ID..."
              value={searchChannel}
              onChange={(e) => setSearchChannel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="failed">Failed</option>
              <option value="expired">Expired</option>
            </Select>
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
              storageKey="subscriptions-table"
              initialColumnVisibility={{
                topic_url: false, // Hide by default
                hub_url: false, // Hide by default
                secret: false, // Hide by default
                lease_seconds: false, // Hide by default
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
            No subscriptions found. Create a subscription to get started.
          </div>
        )}
      </div>
    </div>
  );
}
