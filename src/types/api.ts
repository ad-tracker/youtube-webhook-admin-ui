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
  channel_id: string;
  video_id: string;
  published_at: string;
  updated_at: string;
  title: string;
  link: string;
  author_name: string;
  author_uri: string;
  raw_xml: string;
  processed: boolean;
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
  description: string | null;
  custom_url: string | null;
  thumbnail_url: string | null;
  subscriber_count: number | null;
  video_count: number | null;
  view_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface ChannelFilters extends PaginationParams, OrderParams {
  title?: string;
}

export interface CreateChannelRequest {
  channel_id: string;
  title: string;
  description?: string;
  custom_url?: string;
  thumbnail_url?: string;
  subscriber_count?: number;
  video_count?: number;
  view_count?: number;
}

export interface UpdateChannelRequest {
  title?: string;
  description?: string;
  custom_url?: string;
  thumbnail_url?: string;
  subscriber_count?: number;
  video_count?: number;
  view_count?: number;
}

// Videos
export interface Video {
  video_id: string;
  channel_id: string;
  title: string;
  description: string | null;
  published_at: string;
  thumbnail_url: string | null;
  duration: string | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
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
  description?: string;
  published_at: string;
  thumbnail_url?: string;
  duration?: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
}

export interface UpdateVideoRequest {
  title?: string;
  description?: string;
  published_at?: string;
  thumbnail_url?: string;
  duration?: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
}

// Video Updates
export interface VideoUpdate {
  id: number;
  video_id: string;
  channel_id: string;
  webhook_event_id: number | null;
  update_type: 'new' | 'update' | 'delete';
  previous_data: Record<string, unknown> | null;
  new_data: Record<string, unknown>;
  detected_at: string;
  created_at: string;
}

export interface VideoUpdateFilters extends PaginationParams, OrderParams {
  video_id?: string;
  channel_id?: string;
  webhook_event_id?: number;
  update_type?: 'new' | 'update' | 'delete';
}

export interface CreateVideoUpdateRequest {
  video_id: string;
  channel_id: string;
  webhook_event_id?: number;
  update_type: 'new' | 'update' | 'delete';
  previous_data?: Record<string, unknown>;
  new_data: Record<string, unknown>;
  detected_at?: string;
}

// PubSub Subscriptions
export interface PubSubSubscription {
  id: number;
  channel_id: string;
  topic_url: string;
  callback_url: string;
  lease_seconds: number;
  status: 'pending' | 'verified' | 'denied' | 'expired';
  verified_at: string | null;
  expires_at: string | null;
  challenge: string | null;
  created_at: string;
  updated_at: string;
}

export interface PubSubSubscriptionFilters extends PaginationParams {
  channel_id?: string;
  status?: 'pending' | 'verified' | 'denied' | 'expired';
  expires_before?: string;
}

export interface CreatePubSubSubscriptionRequest {
  channel_id: string;
  callback_url: string;
  lease_seconds?: number;
}

export interface UpdatePubSubSubscriptionRequest {
  status?: 'pending' | 'verified' | 'denied' | 'expired';
  verified_at?: string;
  expires_at?: string;
  challenge?: string;
  lease_seconds?: number;
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
