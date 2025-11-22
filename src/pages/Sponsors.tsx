import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, RefreshCw, Search } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { getAPIClient } from '../lib/api-client';
import { formatDate, truncate } from '../lib/utils';
import type { Sponsor, SponsorFilters, VideoSponsorDetail } from '../types/api';
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
import { Select } from '../components/ui/select';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { Pagination } from '../components/Pagination';
import { Link } from 'react-router-dom';

const ITEMS_PER_PAGE = 50;

/**
 * Sponsors list page
 * Shows all detected sponsors with their video counts and date ranges
 */
export function Sponsors() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<SponsorFilters>({
    limit: ITEMS_PER_PAGE,
    offset: 0,
    order_by: 'video_count',
    order: 'desc',
  });
  const [searchName, setSearchName] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Store sponsor videos for expanded rows
  const [sponsorVideos, setSponsorVideos] = useState<Record<string, VideoSponsorDetail[]>>({});
  const [loadingVideos, setLoadingVideos] = useState<Set<string>>(new Set());

  // Fetch sponsors
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sponsors', filters],
    queryFn: () => getAPIClient().getSponsors(filters),
  });

  // Get unique categories from sponsors
  const categories = useMemo(() => {
    if (!data?.items) return [];
    const uniqueCategories = new Set<string>();
    data.items.forEach((sponsor) => {
      if (sponsor.category) uniqueCategories.add(sponsor.category);
    });
    return Array.from(uniqueCategories).sort();
  }, [data?.items]);

  const handleSearch = () => {
    const newFilters: SponsorFilters = {
      limit: ITEMS_PER_PAGE,
      offset: 0,
      order_by: filters.order_by,
      order: filters.order,
    };

    if (searchName) newFilters.name = searchName;
    if (categoryFilter) newFilters.category = categoryFilter;

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

  const handleSortChange = (sortBy: string) => {
    setFilters((prev) => ({
      ...prev,
      order_by: sortBy,
      offset: 0,
    }));
    setCurrentPage(1);
  };

  // Fetch sponsor videos when row is expanded
  const fetchSponsorVideos = async (sponsorId: string) => {
    if (sponsorVideos[sponsorId] !== undefined || loadingVideos.has(sponsorId)) {
      return; // Already loaded or loading
    }

    setLoadingVideos((prev) => new Set(prev).add(sponsorId));
    try {
      const response = await getAPIClient().getSponsorVideos(sponsorId, { limit: 5 });
      setSponsorVideos((prev) => ({ ...prev, [sponsorId]: response.items }));
    } catch (error) {
      console.error('Failed to fetch sponsor videos:', error);
      setSponsorVideos((prev) => ({ ...prev, [sponsorId]: [] }));
    } finally {
      setLoadingVideos((prev) => {
        const next = new Set(prev);
        next.delete(sponsorId);
        return next;
      });
    }
  };

  // Define columns with TanStack Table
  const columns = useMemo<ColumnDef<Sponsor>[]>(
    () => [
      {
        id: 'expander',
        header: '',
        cell: ({ row }) => <ExpandToggleButton row={row} />,
        enableHiding: false,
        enableSorting: false,
      },
      {
        accessorKey: 'name',
        header: 'Sponsor Name',
        cell: ({ row }) => (
          <Link
            to={`/sponsors/${row.original.id}`}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.category ? (
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                {row.original.category}
              </span>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </span>
        ),
      },
      {
        accessorKey: 'video_count',
        header: 'Videos',
        cell: ({ row }) => (
          <span className="text-sm font-semibold">{row.original.video_count}</span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'first_seen_at',
        header: 'First Seen',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.first_seen_at)}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'last_seen_at',
        header: 'Last Seen',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.last_seen_at)}
          </span>
        ),
        enableSorting: true,
      },
    ],
    []
  );

  if (error) {
    return (
      <div className="p-8">
        <ErrorMessage
          title="Failed to load sponsors"
          message={(error as Error).message}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8" />
            Sponsors
          </h1>
          <p className="text-muted-foreground">
            View all detected sponsors and their video partnerships
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="search-name">Sponsor Name</Label>
                <Input
                  id="search-name"
                  placeholder="Search by name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  id="category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort-by">Sort By</Label>
                <Select
                  id="sort-by"
                  value={filters.order_by || 'video_count'}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="video_count">Video Count (Most)</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="last_seen_at">Last Seen (Recent)</option>
                  <option value="created_at">Created (Recent)</option>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchName('');
                  setCategoryFilter('');
                  setFilters({
                    limit: ITEMS_PER_PAGE,
                    offset: 0,
                    order_by: 'video_count',
                    order: 'desc',
                  });
                  setCurrentPage(1);
                }}
              >
                Clear
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
              <CardTitle>Detected Sponsors</CardTitle>
              <CardDescription>
                {isLoading ? (
                  'Loading...'
                ) : (
                  <>
                    {data?.total ?? 0} sponsor{data?.total === 1 ? '' : 's'}
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
          ) : data?.items && data.items.length > 0 ? (
            <>
              <DataTable
                columns={columns}
                data={data.items}
                enableSorting={true}
                storageKey="sponsors-table"
                getRowCanExpand={() => true}
                renderExpandedRow={(row) => {
                  const sponsorId = row.original.id;

                  // Fetch videos on first expand
                  if (!sponsorVideos[sponsorId] && !loadingVideos.has(sponsorId)) {
                    fetchSponsorVideos(sponsorId);
                  }

                  const videos = sponsorVideos[sponsorId];
                  const isLoadingVideos = loadingVideos.has(sponsorId);

                  if (isLoadingVideos) {
                    return (
                      <div className="p-4">
                        <LoadingSpinner />
                      </div>
                    );
                  }

                  return (
                    <div className="p-4 space-y-4 bg-muted/30">
                      {/* Sponsor Details */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h3 className="text-sm font-semibold mb-2">Details</h3>
                          <dl className="space-y-2 text-sm">
                            {row.original.description && (
                              <div>
                                <dt className="font-medium text-muted-foreground">Description</dt>
                                <dd className="mt-1">{row.original.description}</dd>
                              </div>
                            )}
                            {row.original.website_url && (
                              <div>
                                <dt className="font-medium text-muted-foreground">Website</dt>
                                <dd className="mt-1">
                                  <a
                                    href={row.original.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {row.original.website_url}
                                  </a>
                                </dd>
                              </div>
                            )}
                          </dl>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold mb-2">Statistics</h3>
                          <dl className="space-y-2 text-sm">
                            <div>
                              <dt className="font-medium text-muted-foreground">Total Videos</dt>
                              <dd className="mt-1 font-semibold">{row.original.video_count}</dd>
                            </div>
                            <div>
                              <dt className="font-medium text-muted-foreground">Date Range</dt>
                              <dd className="mt-1">
                                {formatDate(row.original.first_seen_at)} - {formatDate(row.original.last_seen_at)}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>

                      {/* Top Videos */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold">Top 5 Videos</h3>
                          <Link
                            to={`/sponsors/${sponsorId}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View All Videos
                          </Link>
                        </div>
                        {!videos || videos.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No videos found</p>
                        ) : (
                          <div className="space-y-2">
                            {videos.map((video) => (
                              <div
                                key={video.id}
                                className="flex items-center justify-between p-2 bg-background rounded border"
                              >
                                <div className="flex-1 min-w-0">
                                  <a
                                    href={`https://youtube.com/watch?v=${video.video_youtube_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-blue-600 hover:underline"
                                  >
                                    {truncate(video.video_title, 60)}
                                  </a>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Published {formatDate(video.video_published_at)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {Math.round(video.confidence * 100)}% confidence
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }}
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
              <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold">No sponsors found</p>
              <p className="text-sm text-muted-foreground">
                {searchName || categoryFilter
                  ? 'Try adjusting your search filters'
                  : 'No sponsors have been detected yet'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
