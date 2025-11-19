import { type ChannelEnrichment } from '../types/api';
import { formatDistanceToNow } from 'date-fns';

interface ChannelEnrichmentDetailsProps {
  enrichment: ChannelEnrichment;
}

export function ChannelEnrichmentDetails({
  enrichment,
}: ChannelEnrichmentDetailsProps) {
  const formatNumber = (num: number | null) => {
    if (num === null) return 'N/A';
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-6">
      {/* Banner and Thumbnails */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {enrichment.banner_image_url && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Channel Banner</h4>
            <img
              src={enrichment.banner_image_url}
              alt="Channel banner"
              className="w-full rounded border border-gray-200"
            />
          </div>
        )}
        {enrichment.thumbnail_high_url && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Channel Thumbnail</h4>
            <img
              src={enrichment.thumbnail_high_url}
              alt="Channel thumbnail"
              className="w-48 rounded border border-gray-200"
            />
          </div>
        )}
      </div>

      {/* Channel Statistics */}
      <div>
        <h4 className="font-semibold text-sm mb-3">Channel Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <MetricCard
            label="Subscribers"
            value={
              enrichment.hidden_subscriber_count
                ? 'Hidden'
                : formatNumber(enrichment.subscriber_count)
            }
          />
          <MetricCard label="Total Views" value={formatNumber(enrichment.view_count)} />
          <MetricCard label="Videos" value={formatNumber(enrichment.video_count)} />
        </div>
      </div>

      {/* Channel Details */}
      <div>
        <h4 className="font-semibold text-sm mb-3">Channel Details</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DetailItem label="Custom URL" value={enrichment.custom_url || 'N/A'} />
          <DetailItem label="Country" value={enrichment.country || 'N/A'} />
          <DetailItem
            label="Privacy Status"
            value={enrichment.privacy_status || 'N/A'}
          />
          <DetailItem
            label="Made for Kids"
            value={enrichment.made_for_kids ? 'Yes' : 'No'}
          />
          {enrichment.published_at && (
            <DetailItem
              label="Created"
              value={new Date(enrichment.published_at).toLocaleDateString()}
            />
          )}
          <DetailItem
            label="Linked"
            value={enrichment.is_linked ? 'Yes' : 'No'}
          />
          <DetailItem
            label="Long Uploads"
            value={enrichment.long_uploads_status || 'N/A'}
          />
        </div>
      </div>

      {/* Description */}
      {enrichment.description && (
        <div>
          <h4 className="font-semibold text-sm mb-2">Description</h4>
          <p className="text-sm text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto border border-gray-200 rounded p-3 bg-white">
            {enrichment.description}
          </p>
        </div>
      )}

      {/* Keywords */}
      {enrichment.keywords && (
        <div>
          <h4 className="font-semibold text-sm mb-2">Keywords</h4>
          <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded p-3">
            {enrichment.keywords}
          </p>
        </div>
      )}

      {/* Related Playlists */}
      {(enrichment.related_playlists_uploads ||
        enrichment.related_playlists_likes ||
        enrichment.related_playlists_favorites) && (
        <div>
          <h4 className="font-semibold text-sm mb-3">Related Playlists</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {enrichment.related_playlists_uploads && (
              <PlaylistLink
                label="Uploads"
                playlistId={enrichment.related_playlists_uploads}
              />
            )}
            {enrichment.related_playlists_likes && (
              <PlaylistLink
                label="Liked Videos"
                playlistId={enrichment.related_playlists_likes}
              />
            )}
            {enrichment.related_playlists_favorites && (
              <PlaylistLink
                label="Favorites"
                playlistId={enrichment.related_playlists_favorites}
              />
            )}
          </div>
        </div>
      )}

      {/* Topic Categories */}
      {enrichment.topic_categories && enrichment.topic_categories.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-2">
            Topic Categories ({enrichment.topic_categories.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {enrichment.topic_categories.map((topic, index) => {
              // Extract topic name from Wikipedia URL
              const topicName = topic.split('/').pop()?.replace(/_/g, ' ') || topic;
              return (
                <a
                  key={index}
                  href={topic}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors"
                >
                  {topicName}
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Enrichment Metadata */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Enriched {formatDistanceToNow(new Date(enrichment.enriched_at))} ago •
          Quota Cost: {enrichment.quota_cost}
        </p>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-3 rounded border border-gray-200">
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-600">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function PlaylistLink({
  label,
  playlistId,
}: {
  label: string;
  playlistId: string;
}) {
  const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
  return (
    <div className="bg-white p-3 rounded border border-gray-200">
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <a
        href={playlistUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
      >
        View Playlist →
      </a>
    </div>
  );
}
