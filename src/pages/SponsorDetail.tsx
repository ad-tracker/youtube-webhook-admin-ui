import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Sparkles } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { getAPIClient } from '../lib/api-client';
import { formatDate, truncate } from '../lib/utils';
import type { VideoSponsorDetail } from '../types/api';
import { Button } from '../components/ui/button';
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

const ITEMS_PER_PAGE = 50;

/**
 * Sponsor detail page
 * Shows full information about a sponsor including all videos and channel analytics
 */
export function SponsorDetail() {
  const { id } = useParams<{ id: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    limit: ITEMS_PER_PAGE,
    offset: 0,
  });

  // Fetch sponsor details
  const {
    data: sponsor,
    isLoading: isLoadingSponsor,
    error: sponsorError,
  } = useQuery({
    queryKey: ['sponsor', id],
    queryFn: () => getAPIClient().getSponsor(id!),
    enabled: !!id,
  });

  // Fetch sponsor videos
  const {
    data: videosData,
    isLoading: isLoadingVideos,
    error: videosError,
  } = useQuery({
    queryKey: ['sponsor-videos', id, filters],
    queryFn: () => getAPIClient().getSponsorVideos(id!, filters),
    enabled: !!id,
  });

  // Calculate channel analytics from videos
  const channelAnalytics = useMemo(() => {
    if (!videosData?.items) return [];

    const channelMap = new Map<string, { channelId: string; count: number; videos: VideoSponsorDetail[] }>();

    videosData.items.forEach((video) => {
      const existing = channelMap.get(video.video_channel_id);
      if (existing) {
        existing.count++;
        existing.videos.push(video);
      } else {
        channelMap.set(video.video_channel_id, {
          channelId: video.video_channel_id,
          count: 1,
          videos: [video],
        });
      }
    });

    return Array.from(channelMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 channels
  }, [videosData]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFilters((prev) => ({
      ...prev,
      offset: (page - 1) * ITEMS_PER_PAGE,
    }));
  };

  // Define columns for videos table
  const columns = useMemo<ColumnDef<VideoSponsorDetail>[]>(
    () => [
      {
        id: 'expander',
        header: '',
        cell: ({ row }) => <ExpandToggleButton row={row} />,
        enableHiding: false,
        enableSorting: false,
      },
      {
        accessorKey: 'video_title',
        header: 'Video Title',
        cell: ({ row }) => (
          <a
            href={`https://youtube.com/watch?v=${row.original.video_youtube_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            {truncate(row.original.video_title, 60)}
          </a>
        ),
      },
      {
        accessorKey: 'video_channel_id',
        header: 'Channel',
        cell: ({ row }) => (
          <span className="text-sm font-mono">{truncate(row.original.video_channel_id, 20)}</span>
        ),
      },
      {
        accessorKey: 'video_published_at',
        header: 'Published',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.video_published_at)}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'confidence',
        header: 'Confidence',
        cell: ({ row }) => {
          const confidence = Math.round(row.original.confidence * 100);
          const color =
            confidence >= 90
              ? 'text-green-600'
              : confidence >= 70
              ? 'text-yellow-600'
              : 'text-orange-600';

          return (
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${confidence >= 90 ? 'bg-green-600' : confidence >= 70 ? 'bg-yellow-600' : 'bg-orange-600'}`}
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <span className={`text-sm font-medium ${color}`}>{confidence}%</span>
            </div>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: 'first_detected_at',
        header: 'Detected',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.first_detected_at)}
          </span>
        ),
        enableSorting: true,
      },
    ],
    []
  );

  if (sponsorError) {
    return (
      <div className="p-8">
        <ErrorMessage
          title="Failed to load sponsor"
          message={(sponsorError as Error).message}
        />
      </div>
    );
  }

  if (isLoadingSponsor) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!sponsor) {
    return (
      <div className="p-8">
        <ErrorMessage title="Sponsor not found" message="The requested sponsor could not be found." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Header */}
      <div>
        <Link
          to="/sponsors"
          className="inline-flex items-center text-sm text-blue-600 hover:underline mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Sponsors
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-8 w-8" />
              {sponsor.name}
            </h1>
            {sponsor.category && (
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 mt-2">
                {sponsor.category}
              </span>
            )}
          </div>
          {sponsor.website_url && (
            <a
              href={sponsor.website_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                Visit Website
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Sponsor Info */}
      <Card>
        <CardHeader>
          <CardTitle>Sponsor Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2">
            {sponsor.description && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-muted-foreground">Description</dt>
                <dd className="mt-1 text-sm">{sponsor.description}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Total Videos</dt>
              <dd className="mt-1 text-2xl font-semibold">{sponsor.video_count}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Date Range</dt>
              <dd className="mt-1 text-sm">
                <div>First seen: {formatDate(sponsor.first_seen_at)}</div>
                <div>Last seen: {formatDate(sponsor.last_seen_at)}</div>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Channel Analytics */}
      {channelAnalytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Channels</CardTitle>
            <CardDescription>
              Channels with the most videos featuring this sponsor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {channelAnalytics.map(({ channelId, count, videos }) => {
                const firstVideo = videos[0];
                const dateRange = videos.length > 1
                  ? `${formatDate(videos[videos.length - 1].first_detected_at)} - ${formatDate(videos[0].first_detected_at)}`
                  : formatDate(firstVideo.first_detected_at);

                return (
                  <div
                    key={channelId}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded border"
                  >
                    <div className="flex-1">
                      <div className="font-medium font-mono text-sm">{channelId}</div>
                      <div className="text-xs text-muted-foreground mt-1">{dateRange}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">{count}</div>
                      <div className="text-xs text-muted-foreground">
                        video{count === 1 ? '' : 's'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Videos Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Videos</CardTitle>
          <CardDescription>
            {isLoadingVideos ? (
              'Loading...'
            ) : (
              <>
                {videosData?.total ?? 0} video{videosData?.total === 1 ? '' : 's'} featuring this sponsor
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingVideos ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : videosError ? (
            <ErrorMessage message={(videosError as Error).message} />
          ) : videosData?.items && videosData.items.length > 0 ? (
            <>
              <DataTable
                columns={columns}
                data={videosData.items}
                enableSorting={true}
                storageKey="sponsor-videos-table"
                getRowCanExpand={() => true}
                renderExpandedRow={(row) => {
                  const video = row.original;

                  return (
                    <div className="p-4 space-y-3 bg-muted/30">
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Detection Details</h4>
                        <dl className="grid gap-3 md:grid-cols-2 text-sm">
                          <div>
                            <dt className="font-medium text-muted-foreground">Video ID</dt>
                            <dd className="mt-1 font-mono">{video.video_youtube_id}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-muted-foreground">Channel ID</dt>
                            <dd className="mt-1 font-mono">{video.video_channel_id}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-muted-foreground">Confidence Score</dt>
                            <dd className="mt-1">{Math.round(video.confidence * 100)}%</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-muted-foreground">Detection Date</dt>
                            <dd className="mt-1">{formatDate(video.first_detected_at)}</dd>
                          </div>
                          {video.evidence && (
                            <div className="md:col-span-2">
                              <dt className="font-medium text-muted-foreground">Evidence</dt>
                              <dd className="mt-1 text-sm bg-background p-2 rounded border">
                                {video.evidence}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>
                  );
                }}
              />
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalItems={videosData.total}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No videos found for this sponsor
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
