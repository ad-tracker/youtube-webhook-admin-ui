/**
 * API Types for YouTube Webhook Ingestion API
 * All types match the API schema exactly
 */

// Common pagination and filter types
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface OrderParams {
  order_by?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// Webhook Events
export interface WebhookEvent {
  id: number;
  raw_xml: string;
  content_hash: string;
  received_at: string;
  processed: boolean;
  processed_at: string | null;
  processing_error: string | null;
  video_id: string | null;
  channel_id: string | null;
  created_at: string;
}

export interface WebhookEventFilters extends PaginationParams, OrderParams {
  processed?: boolean;
  video_id?: string;
  channel_id?: string;
}

export interface UpdateWebhookEventRequest {
  processed: boolean;
}

// Channels
export interface Channel {
  channel_id: string;
  title: string;
  channel_url: string;
  first_seen_at: string;
  last_updated_at: string;
  created_at: string;
  updated_at: string;
}

export interface ChannelFilters extends PaginationParams, OrderParams {
  title?: string;
}

export interface CreateChannelRequest {
  channel_id: string;
  title: string;
  channel_url: string;
}

export interface UpdateChannelRequest {
  title: string;
  channel_url: string;
}

// Videos
export interface Video {
  video_id: string;
  channel_id: string;
  title: string;
  video_url: string;
  published_at: string;
  first_seen_at: string;
  last_updated_at: string;
  created_at: string;
  updated_at: string;
}

export interface VideoFilters extends PaginationParams, OrderParams {
  channel_id?: string;
  title?: string;
  published_after?: string;
  published_before?: string;
}

export interface CreateVideoRequest {
  video_id: string;
  channel_id: string;
  title: string;
  video_url: string;
  published_at: string;
}

export interface UpdateVideoRequest {
  title: string;
  video_url: string;
  published_at: string;
}

// Video Updates
export interface VideoUpdate {
  id: number;
  webhook_event_id: number;
  video_id: string;
  channel_id: string;
  title: string;
  published_at: string;
  feed_updated_at: string;
  update_type: string;
  created_at: string;
}

export interface VideoUpdateFilters extends PaginationParams, OrderParams {
  video_id?: string;
  channel_id?: string;
  webhook_event_id?: number;
  update_type?: string;
}

export interface CreateVideoUpdateRequest {
  webhook_event_id: number;
  video_id: string;
  channel_id: string;
  title: string;
  published_at: string;
  feed_updated_at: string;
  update_type: string;
}

// PubSub Subscriptions
export interface PubSubSubscription {
  id: number;
  channel_id: string;
  topic_url: string;
  hub_url: string;
  lease_seconds: number;
  expires_at: string;
  status: 'pending' | 'active' | 'expired' | 'failed';
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PubSubSubscriptionFilters extends PaginationParams {
  channel_id?: string;
  status?: 'pending' | 'active' | 'expired' | 'failed';
  expires_before?: string;
}

export interface CreatePubSubSubscriptionRequest {
  channel_id: string;
  lease_seconds?: number;
}

export interface UpdatePubSubSubscriptionRequest {
  lease_seconds?: number;
  status?: string;
  expires_at?: string;
  last_verified_at?: string;
}

// API Error Response
export interface APIError {
  detail: string;
  status?: number;
}

// Video API Enrichments
export interface VideoThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface VideoEnrichment {
  id: number;
  video_id: string;

  // Basic metadata
  description: string | null;
  duration: string | null;
  dimension: string | null;
  definition: string | null;
  caption: string | null;
  licensed_content: boolean | null;
  projection: string | null;

  // Thumbnails
  thumbnail_default_url: string | null;
  thumbnail_default_width: number | null;
  thumbnail_default_height: number | null;
  thumbnail_medium_url: string | null;
  thumbnail_medium_width: number | null;
  thumbnail_medium_height: number | null;
  thumbnail_high_url: string | null;
  thumbnail_high_width: number | null;
  thumbnail_high_height: number | null;
  thumbnail_standard_url: string | null;
  thumbnail_standard_width: number | null;
  thumbnail_standard_height: number | null;
  thumbnail_maxres_url: string | null;
  thumbnail_maxres_width: number | null;
  thumbnail_maxres_height: number | null;

  // Engagement metrics
  view_count: number | null;
  like_count: number | null;
  dislike_count: number | null;
  favorite_count: number | null;
  comment_count: number | null;

  // Categorization
  category_id: string | null;
  tags: string[] | null;
  default_language: string | null;
  default_audio_language: string | null;
  topic_categories: string[] | null;

  // Content classification
  privacy_status: string | null;
  license: string | null;
  embeddable: boolean | null;
  public_stats_viewable: boolean | null;
  made_for_kids: boolean | null;
  self_declared_made_for_kids: boolean | null;

  // Upload details
  upload_status: string | null;
  failure_reason: string | null;
  rejection_reason: string | null;

  // Live streaming details
  live_broadcast_content: string | null;
  scheduled_start_time: string | null;
  actual_start_time: string | null;
  actual_end_time: string | null;
  concurrent_viewers: number | null;

  // Location data
  location_description: string | null;
  location_latitude: number | null;
  location_longitude: number | null;

  // Content rating
  content_rating: Record<string, unknown> | null;

  // Channel info
  channel_title: string | null;

  // API metadata
  enriched_at: string;
  api_response_etag: string | null;
  quota_cost: number;
  api_parts_requested: string[] | null;
  raw_api_response: Record<string, unknown> | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface VideoEnrichmentFilters extends PaginationParams, OrderParams {
  video_id?: string;
  enriched_after?: string;
  enriched_before?: string;
}

// Channel API Enrichments
export interface ChannelEnrichment {
  id: number;
  channel_id: string;

  // Basic metadata
  description: string | null;
  custom_url: string | null;
  country: string | null;
  published_at: string | null;

  // Thumbnails
  thumbnail_default_url: string | null;
  thumbnail_medium_url: string | null;
  thumbnail_high_url: string | null;

  // Statistics
  view_count: number | null;
  subscriber_count: number | null;
  video_count: number | null;
  hidden_subscriber_count: boolean | null;

  // Branding
  banner_image_url: string | null;
  keywords: string | null;

  // Content details
  related_playlists_likes: string | null;
  related_playlists_uploads: string | null;
  related_playlists_favorites: string | null;

  // Topic details
  topic_categories: string[] | null;

  // Status
  privacy_status: string | null;
  is_linked: boolean | null;
  long_uploads_status: string | null;
  made_for_kids: boolean | null;

  // API metadata
  enriched_at: string;
  api_response_etag: string | null;
  quota_cost: number;
  api_parts_requested: string[] | null;
  raw_api_response: Record<string, unknown> | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ChannelEnrichmentFilters extends PaginationParams, OrderParams {
  channel_id?: string;
  country?: string;
  enriched_after?: string;
  enriched_before?: string;
}

// Batch enrichment request for fetching multiple enrichments at once
export interface BatchEnrichmentRequest {
  ids: string[]; // video_ids or channel_ids
}

// API Configuration
export interface APIConfig {
  baseURL: string;
  apiKey: string;
}
