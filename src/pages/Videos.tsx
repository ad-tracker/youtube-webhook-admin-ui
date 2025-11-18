import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { getAPIClient } from '../lib/api-client';
import { formatDate, truncate } from '../lib/utils';
import type { VideoFilters, CreateVideoRequest } from '../types/api';
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

  // Fetch videos
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['videos', filters],
    queryFn: () => getAPIClient().getVideos(filters),
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

  const handleDelete = (videoId: string, title: string) => {
    if (confirm(`Are you sure you want to delete video "${title}"?`)) {
      deleteMutation.mutate(videoId);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Video ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Channel ID</TableHead>
                  <TableHead>Video URL</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((video) => (
                  <TableRow key={video.video_id}>
                    <TableCell className="font-mono text-xs">
                      {truncate(video.video_id, 15)}
                    </TableCell>
                    <TableCell className="max-w-xs font-medium">
                      {truncate(video.title, 50)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {truncate(video.channel_id, 15)}
                    </TableCell>
                    <TableCell className="text-xs">
                      <a
                        href={video.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {truncate(video.video_url, 30)}
                      </a>
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDate(video.published_at)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDate(video.last_updated_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(video.video_id, video.title)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
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
            No videos found. Try adjusting your filters.
          </div>
        )}
      </div>
    </div>
  );
}
