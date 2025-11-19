import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIClient, APIClientError } from '../api-client';

describe('APIClient', () => {
  let client: APIClient;
  const mockBaseURL = 'http://localhost:8000';
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    client = new APIClient({
      baseURL: mockBaseURL,
      apiKey: mockApiKey,
    });
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with config and remove trailing slash from baseURL', () => {
      const clientWithSlash = new APIClient({
        baseURL: 'http://localhost:8000/',
        apiKey: mockApiKey,
      });
      expect(clientWithSlash).toBeDefined();
    });
  });

  describe('getWebhookEvents', () => {
    it('should fetch webhook events with filters', async () => {
      const mockResponse = {
        items: [
          {
            id: 1,
            channel_id: 'UCtest',
            video_id: 'test123',
            title: 'Test Video',
            processed: false,
            published_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            link: 'https://youtube.com/watch?v=test123',
            author_name: 'Test Channel',
            author_uri: 'https://youtube.com/channel/UCtest',
            raw_xml: '<xml></xml>',
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      const result = await client.getWebhookEvents({ limit: 20, offset: 0 });

      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseURL}/api/v1/webhook-events?limit=20&offset=0`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': mockApiKey,
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ detail: 'Unauthorized' }),
      });

      await expect(client.getWebhookEvents()).rejects.toThrow(APIClientError);
      await expect(client.getWebhookEvents()).rejects.toThrow('Unauthorized');
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(client.getWebhookEvents()).rejects.toThrow(APIClientError);
    });
  });

  describe('updateWebhookEvent', () => {
    it('should update webhook event status', async () => {
      const mockResponse = {
        id: 1,
        processed: true,
        channel_id: 'UCtest',
        video_id: 'test123',
        title: 'Test Video',
        published_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        link: 'https://youtube.com/watch?v=test123',
        author_name: 'Test Channel',
        author_uri: 'https://youtube.com/channel/UCtest',
        raw_xml: '<xml></xml>',
        created_at: '2024-01-01T00:00:00Z',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      const result = await client.updateWebhookEvent(1, { processed: true });

      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseURL}/api/v1/webhook-events/1`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ processed: true }),
        })
      );
      expect(result.processed).toBe(true);
    });
  });

  describe('getChannels', () => {
    it('should fetch channels with filters', async () => {
      const mockResponse = {
        items: [
          {
            channel_id: 'UCtest',
            title: 'Test Channel',
            description: 'Test Description',
            custom_url: null,
            thumbnail_url: null,
            subscriber_count: 1000,
            video_count: 50,
            view_count: 10000,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      const result = await client.getChannels({ title: 'Test' });

      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseURL}/api/v1/channels?title=Test`,
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createChannel', () => {
    it('should create a new channel', async () => {
      const channelData = {
        channel_id: 'UCnew',
        title: 'New Channel',
        description: 'New Description',
      };

      const mockResponse = {
        ...channelData,
        custom_url: null,
        thumbnail_url: null,
        subscriber_count: null,
        video_count: null,
        view_count: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      const result = await client.createChannel(channelData);

      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseURL}/api/v1/channels`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(channelData),
        })
      );
      expect(result.channel_id).toBe(channelData.channel_id);
    });
  });

  describe('deleteChannel', () => {
    it('should delete a channel', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
      });

      const result = await client.deleteChannel('UCtest');

      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseURL}/api/v1/channels/UCtest`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result).toBeUndefined();
    });
  });

  describe('Go SQL null type transformation', () => {
    it('should transform sql.NullString with Valid=true to plain string', async () => {
      const mockResponse = {
        items: [
          {
            id: 1,
            video_id: { String: 'test123', Valid: true },
            channel_id: { String: 'UCtest', Valid: true },
            processing_error: { String: '', Valid: false },
            processed: true,
            received_at: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      const result = await client.getWebhookEvents();

      expect(result.items[0].video_id).toBe('test123');
      expect(result.items[0].channel_id).toBe('UCtest');
      expect(result.items[0].processing_error).toBe(null);
    });

    it('should transform sql.NullTime with Valid=true to plain string', async () => {
      const mockResponse = {
        items: [
          {
            id: 1,
            processed_at: { Time: '2024-01-01T00:00:00Z', Valid: true },
            processed: true,
            received_at: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      const result = await client.getWebhookEvents();

      expect(result.items[0].processed_at).toBe('2024-01-01T00:00:00Z');
    });
  });

  describe('error handling', () => {
    it('should handle non-JSON error responses', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'Server Error',
      });

      await expect(client.getWebhookEvents()).rejects.toThrow('Server Error');
    });

    it('should handle HTML error pages with clean error message', async () => {
      const htmlError = '<!DOCTYPE html><html><body>Error page</body></html>';
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        headers: new Headers({ 'content-type': 'text/html' }),
        text: async () => htmlError,
      });

      await expect(client.getWebhookEvents()).rejects.toThrow(
        'Server error (502 Bad Gateway). The API may be unavailable.'
      );
    });

    it('should handle HTML error pages starting with <html tag', async () => {
      const htmlError = '<html><body>Error</body></html>';
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: async () => htmlError,
      });

      await expect(client.getWebhookEvents()).rejects.toThrow(
        'Server error (503 Service Unavailable). The API may be unavailable.'
      );
    });

    it('should handle 204 No Content responses', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
      });

      const result = await client.deleteChannel('UCtest');
      expect(result).toBeUndefined();
    });
  });
});
