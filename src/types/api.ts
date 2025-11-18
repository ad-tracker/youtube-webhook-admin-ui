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
  callback_url: string;
  hub_url: string;
  lease_seconds: number;
  expires_at: string;
  status: 'pending' | 'active' | 'expired' | 'failed';
  secret: string | null;
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
  callback_url: string;
  lease_seconds?: number;
  secret?: string;
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

// API Configuration
export interface APIConfig {
  baseURL: string;
  apiKey: string;
}
