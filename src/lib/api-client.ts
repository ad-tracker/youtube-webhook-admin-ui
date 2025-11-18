import type {
  APIConfig,
  APIError,
  Channel,
  ChannelFilters,
  CreateChannelRequest,
  CreatePubSubSubscriptionRequest,
  CreateVideoRequest,
  CreateVideoUpdateRequest,
  PaginatedResponse,
  PubSubSubscription,
  PubSubSubscriptionFilters,
  UpdateChannelRequest,
  UpdatePubSubSubscriptionRequest,
  UpdateVideoRequest,
  UpdateWebhookEventRequest,
  Video,
  VideoFilters,
  VideoUpdate,
  VideoUpdateFilters,
  WebhookEvent,
  WebhookEventFilters,
} from '../types/api';

/**
 * Custom error class for API errors
 */
export class APIClientError extends Error {
  status?: number;
  detail?: string;

  constructor(message: string, status?: number, detail?: string) {
    super(message);
    this.name = 'APIClientError';
    this.status = status;
    this.detail = detail;
  }
}

/**
 * API Client for YouTube Webhook Ingestion API
 * Handles all HTTP requests with proper authentication and error handling
 */
export class APIClient {
  private baseURL: string;
  private apiKey: string;

  constructor(config: APIConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = config.apiKey;
  }

  /**
   * Makes an authenticated HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');

      if (!response.ok) {
        if (isJson) {
          const errorData = (await response.json()) as APIError;
          throw new APIClientError(
            errorData.detail || 'API request failed',
            response.status,
            errorData.detail
          );
        } else {
          const errorText = await response.text();
          throw new APIClientError(
            errorText || `HTTP ${response.status}: ${response.statusText}`,
            response.status
          );
        }
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      if (!isJson) {
        throw new APIClientError('Expected JSON response from API', response.status);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof APIClientError) {
        throw error;
      }

      // Network or other errors
      if (error instanceof Error) {
        throw new APIClientError(error.message);
      }

      throw new APIClientError('An unknown error occurred');
    }
  }

  /**
   * Builds query string from filter parameters
   */
  private buildQueryString(params: Record<string, unknown> | object): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  // ==================== Webhook Events ====================

  async getWebhookEvents(
    filters: WebhookEventFilters = {}
  ): Promise<PaginatedResponse<WebhookEvent>> {
    const query = this.buildQueryString(filters);
    return this.request<PaginatedResponse<WebhookEvent>>(
      `/api/v1/webhook-events${query}`
    );
  }

  async getWebhookEventById(id: number): Promise<WebhookEvent> {
    return this.request<WebhookEvent>(`/api/v1/webhook-events/${id}`);
  }

  async updateWebhookEvent(
    id: number,
    data: UpdateWebhookEventRequest
  ): Promise<WebhookEvent> {
    return this.request<WebhookEvent>(`/api/v1/webhook-events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ==================== Channels ====================

  async getChannels(
    filters: ChannelFilters = {}
  ): Promise<PaginatedResponse<Channel>> {
    const query = this.buildQueryString(filters);
    return this.request<PaginatedResponse<Channel>>(`/api/v1/channels${query}`);
  }

  async getChannelById(channelId: string): Promise<Channel> {
    return this.request<Channel>(`/api/v1/channels/${channelId}`);
  }

  async createChannel(data: CreateChannelRequest): Promise<Channel> {
    return this.request<Channel>('/api/v1/channels', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateChannel(
    channelId: string,
    data: UpdateChannelRequest
  ): Promise<Channel> {
    return this.request<Channel>(`/api/v1/channels/${channelId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteChannel(channelId: string): Promise<void> {
    return this.request<void>(`/api/v1/channels/${channelId}`, {
      method: 'DELETE',
    });
  }

  // ==================== Videos ====================

  async getVideos(filters: VideoFilters = {}): Promise<PaginatedResponse<Video>> {
    const query = this.buildQueryString(filters);
    return this.request<PaginatedResponse<Video>>(`/api/v1/videos${query}`);
  }

  async getVideoById(videoId: string): Promise<Video> {
    return this.request<Video>(`/api/v1/videos/${videoId}`);
  }

  async createVideo(data: CreateVideoRequest): Promise<Video> {
    return this.request<Video>('/api/v1/videos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVideo(videoId: string, data: UpdateVideoRequest): Promise<Video> {
    return this.request<Video>(`/api/v1/videos/${videoId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVideo(videoId: string): Promise<void> {
    return this.request<void>(`/api/v1/videos/${videoId}`, {
      method: 'DELETE',
    });
  }

  // ==================== Video Updates ====================

  async getVideoUpdates(
    filters: VideoUpdateFilters = {}
  ): Promise<PaginatedResponse<VideoUpdate>> {
    const query = this.buildQueryString(filters);
    return this.request<PaginatedResponse<VideoUpdate>>(
      `/api/v1/video-updates${query}`
    );
  }

  async getVideoUpdateById(id: number): Promise<VideoUpdate> {
    return this.request<VideoUpdate>(`/api/v1/video-updates/${id}`);
  }

  async createVideoUpdate(data: CreateVideoUpdateRequest): Promise<VideoUpdate> {
    return this.request<VideoUpdate>('/api/v1/video-updates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==================== PubSub Subscriptions ====================

  async getPubSubSubscriptions(
    filters: PubSubSubscriptionFilters = {}
  ): Promise<PaginatedResponse<PubSubSubscription>> {
    const query = this.buildQueryString(filters);
    return this.request<PaginatedResponse<PubSubSubscription>>(
      `/api/v1/subscriptions${query}`
    );
  }

  async getPubSubSubscriptionById(id: number): Promise<PubSubSubscription> {
    return this.request<PubSubSubscription>(`/api/v1/subscriptions/${id}`);
  }

  async createPubSubSubscription(
    data: CreatePubSubSubscriptionRequest
  ): Promise<PubSubSubscription> {
    return this.request<PubSubSubscription>('/api/v1/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePubSubSubscription(
    id: number,
    data: UpdatePubSubSubscriptionRequest
  ): Promise<PubSubSubscription> {
    return this.request<PubSubSubscription>(`/api/v1/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePubSubSubscription(id: number): Promise<void> {
    return this.request<void>(`/api/v1/subscriptions/${id}`, {
      method: 'DELETE',
    });
  }
}

/**
 * Singleton instance of API client
 * This will be initialized when the user provides API credentials
 */
let apiClientInstance: APIClient | null = null;

export function initializeAPIClient(config: APIConfig): void {
  apiClientInstance = new APIClient(config);
}

export function getAPIClient(): APIClient {
  if (!apiClientInstance) {
    throw new Error('API client not initialized. Please configure API credentials.');
  }
  return apiClientInstance;
}

export function isAPIClientInitialized(): boolean {
  return apiClientInstance !== null;
}
