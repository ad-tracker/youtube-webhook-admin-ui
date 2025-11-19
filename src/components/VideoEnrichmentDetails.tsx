import { type VideoEnrichment } from '../types/api';
import { formatDistanceToNow } from 'date-fns';

interface VideoEnrichmentDetailsProps {
  enrichment: VideoEnrichment;
}

export function VideoEnrichmentDetails({ enrichment }: VideoEnrichmentDetailsProps) {
  const formatNumber = (num: number | null) => {
    if (num === null) return 'N/A';
    return new Intl.NumberFormat().format(num);
  };

  const formatDuration = (duration: string | null) => {
    if (!duration) return 'N/A';
    // Parse ISO 8601 duration (e.g., "PT4M13S" -> "4:13")
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;
    const [, hours, minutes, seconds] = match;
    const parts = [];
    if (hours) parts.push(hours);
    parts.push(minutes || '0');
    if (seconds) parts.push(seconds.padStart(2, '0'));
    return parts.join(':');
  };

  const getThumbnails = () => {
    const thumbnails = [];
    if (enrichment.thumbnail_maxres_url) {
      thumbnails.push({
        label: 'Max Resolution',
        url: enrichment.thumbnail_maxres_url,
        width: enrichment.thumbnail_maxres_width,
        height: enrichment.thumbnail_maxres_height,
      });
    }
    if (enrichment.thumbnail_standard_url) {
      thumbnails.push({
        label: 'Standard',
        url: enrichment.thumbnail_standard_url,
        width: enrichment.thumbnail_standard_width,
        height: enrichment.thumbnail_standard_height,
      });
    }
    if (enrichment.thumbnail_high_url) {
      thumbnails.push({
        label: 'High',
        url: enrichment.thumbnail_high_url,
        width: enrichment.thumbnail_high_width,
        height: enrichment.thumbnail_high_height,
      });
    }
    return thumbnails;
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-6">
      {/* Thumbnails */}
      {getThumbnails().length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-3">Thumbnails</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getThumbnails().map((thumb) => (
              <div key={thumb.label} className="space-y-2">
                <img
                  src={thumb.url}
                  alt={`${thumb.label} thumbnail`}
                  className="w-full rounded border border-gray-200"
                />
                <p className="text-xs text-gray-600">
                  {thumb.label} ({thumb.width}×{thumb.height})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Engagement Metrics */}
      <div>
        <h4 className="font-semibold text-sm mb-3">Engagement Metrics</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard label="Views" value={formatNumber(enrichment.view_count)} />
          <MetricCard label="Likes" value={formatNumber(enrichment.like_count)} />
          <MetricCard label="Comments" value={formatNumber(enrichment.comment_count)} />
          <MetricCard label="Favorites" value={formatNumber(enrichment.favorite_count)} />
          {enrichment.concurrent_viewers !== null && (
            <MetricCard
              label="Concurrent Viewers"
              value={formatNumber(enrichment.concurrent_viewers)}
            />
          )}
        </div>
      </div>

      {/* Video Details */}
      <div>
        <h4 className="font-semibold text-sm mb-3">Video Details</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DetailItem label="Duration" value={formatDuration(enrichment.duration)} />
          <DetailItem
            label="Definition"
            value={enrichment.definition?.toUpperCase() || 'N/A'}
          />
          <DetailItem
            label="Dimension"
            value={enrichment.dimension?.toUpperCase() || 'N/A'}
          />
          <DetailItem
            label="Projection"
            value={enrichment.projection || 'N/A'}
          />
          <DetailItem label="Privacy" value={enrichment.privacy_status || 'N/A'} />
          <DetailItem label="License" value={enrichment.license || 'N/A'} />
          <DetailItem
            label="Embeddable"
            value={enrichment.embeddable ? 'Yes' : 'No'}
          />
          <DetailItem
            label="Made for Kids"
            value={enrichment.made_for_kids ? 'Yes' : 'No'}
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

      {/* Tags */}
      {enrichment.tags && enrichment.tags.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-2">Tags ({enrichment.tags.length})</h4>
          <div className="flex flex-wrap gap-2">
            {enrichment.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Live Streaming Info */}
      {enrichment.live_broadcast_content &&
        enrichment.live_broadcast_content !== 'none' && (
          <div>
            <h4 className="font-semibold text-sm mb-3">Live Streaming</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <DetailItem
                label="Status"
                value={enrichment.live_broadcast_content}
              />
              {enrichment.scheduled_start_time && (
                <DetailItem
                  label="Scheduled Start"
                  value={new Date(enrichment.scheduled_start_time).toLocaleString()}
                />
              )}
              {enrichment.actual_start_time && (
                <DetailItem
                  label="Actual Start"
                  value={new Date(enrichment.actual_start_time).toLocaleString()}
                />
              )}
              {enrichment.actual_end_time && (
                <DetailItem
                  label="Actual End"
                  value={new Date(enrichment.actual_end_time).toLocaleString()}
                />
              )}
            </div>
          </div>
        )}

      {/* Location */}
      {enrichment.location_description && (
        <div>
          <h4 className="font-semibold text-sm mb-3">Location</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailItem label="Description" value={enrichment.location_description} />
            {enrichment.location_latitude && (
              <DetailItem
                label="Latitude"
                value={enrichment.location_latitude.toString()}
              />
            )}
            {enrichment.location_longitude && (
              <DetailItem
                label="Longitude"
                value={enrichment.location_longitude.toString()}
              />
            )}
          </div>
        </div>
      )}

      {/* Enrichment Metadata */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Enriched {formatDistanceToNow(new Date(enrichment.enriched_at))} ago •
          Quota Cost: {enrichment.quota_cost} •
          Category: {enrichment.category_id || 'N/A'}
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
