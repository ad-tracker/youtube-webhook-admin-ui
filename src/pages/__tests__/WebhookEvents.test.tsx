import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WebhookEvents } from '../WebhookEvents';
import * as apiClient from '../../lib/api-client';
import { APIClient } from '../../lib/api-client';
import type { WebhookEvent, PaginatedResponse } from '../../types/api';

vi.mock('../../lib/api-client', () => ({
  getAPIClient: vi.fn(),
}));

const mockWebhookEvents: WebhookEvent[] = [
  {
    id: 1,
    raw_xml: '<xml>test data</xml>',
    content_hash: 'abc123def456',
    received_at: '2024-01-01T00:00:00Z',
    processed: false,
    processed_at: null,
    processing_error: null,
    video_id: 'dQw4w9WgXcQ',
    channel_id: 'UC1234567890',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    raw_xml: '<xml>processed data</xml>',
    content_hash: 'xyz789uvw456',
    received_at: '2024-01-02T00:00:00Z',
    processed: true,
    processed_at: '2024-01-02T01:00:00Z',
    processing_error: null,
    video_id: 'abc123XYZ',
    channel_id: 'UC0987654321',
    created_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 3,
    raw_xml: '<xml>error data</xml>',
    content_hash: 'err111err222',
    received_at: '2024-01-03T00:00:00Z',
    processed: true,
    processed_at: '2024-01-03T01:00:00Z',
    processing_error: 'Failed to parse video data',
    video_id: null,
    channel_id: null,
    created_at: '2024-01-03T00:00:00Z',
  },
];

const mockPaginatedResponse: PaginatedResponse<WebhookEvent> = {
  items: mockWebhookEvents,
  total: 3,
  limit: 20,
  offset: 0,
};

describe('WebhookEvents', () => {
  let queryClient: QueryClient;
  let mockGetWebhookEvents: ReturnType<typeof vi.fn>;
  let mockUpdateWebhookEvent: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockGetWebhookEvents = vi.fn().mockResolvedValue(mockPaginatedResponse);
    mockUpdateWebhookEvent = vi.fn().mockResolvedValue(mockWebhookEvents[0]);

    vi.mocked(apiClient.getAPIClient).mockReturnValue({
      getWebhookEvents: mockGetWebhookEvents,
      updateWebhookEvent: mockUpdateWebhookEvent,
    } as Partial<APIClient> as APIClient);
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <WebhookEvents />
      </QueryClientProvider>
    );
  };

  it('should render webhook events list with correct data', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('dQw4w9WgXcQ')).toBeInTheDocument();
    });

    expect(screen.getByText('abc123XYZ')).toBeInTheDocument();
    expect(screen.getByText(/UC1234567890/)).toBeInTheDocument();
    expect(screen.getByText(/UC0987654321/)).toBeInTheDocument();
  });

  it('should display loading state while fetching data', async () => {
    mockGetWebhookEvents.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockPaginatedResponse), 100))
    );

    renderComponent();

    // During loading, the table shouldn't be visible yet
    expect(screen.queryByText(/dQw4w9WgXcQ/)).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/dQw4w9WgXcQ/)).toBeInTheDocument();
    });
  });

  it('should display error message when API call fails', async () => {
    const errorMessage = 'Failed to fetch webhook events';
    mockGetWebhookEvents.mockRejectedValue(new Error(errorMessage));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should show processed and pending badges correctly', async () => {
    renderComponent();

    await waitFor(() => {
      // Event 1 is not processed, so should show "Pending"
      const pendingBadges = screen.getAllByText(/Pending/);
      expect(pendingBadges.length).toBeGreaterThanOrEqual(1);

      // Events 2 and 3 are processed, so should show "Processed"
      const processedBadges = screen.getAllByText(/Processed/);
      expect(processedBadges.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('should display processing errors when present', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Failed to parse video data/)).toBeInTheDocument();
    });
  });

  it('should show N/A for null video_id and channel_id', async () => {
    renderComponent();

    await waitFor(() => {
      const naElements = screen.getAllByText('N/A');
      expect(naElements.length).toBeGreaterThan(0);
    });
  });

  it('should filter by processed status', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('dQw4w9WgXcQ')).toBeInTheDocument();
    });

    const statusSelect = screen.getByRole('combobox');
    await user.selectOptions(statusSelect, 'true');

    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(mockGetWebhookEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          processed: true,
        })
      );
    });
  });

  it('should filter by video ID', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('dQw4w9WgXcQ')).toBeInTheDocument();
    });

    const videoIdInput = screen.getByPlaceholderText(/filter by video id/i);
    await user.type(videoIdInput, 'dQw4w9WgXcQ');

    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(mockGetWebhookEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          video_id: 'dQw4w9WgXcQ',
        })
      );
    });
  });

  it('should filter by channel ID', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('dQw4w9WgXcQ')).toBeInTheDocument();
    });

    const channelIdInput = screen.getByPlaceholderText(/filter by channel id/i);
    await user.type(channelIdInput, 'UC1234567890');

    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(mockGetWebhookEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          channel_id: 'UC1234567890',
        })
      );
    });
  });

  it('should toggle processed status when button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('dQw4w9WgXcQ')).toBeInTheDocument();
    });

    const markAsProcessedButtons = screen.getAllByRole('button', { name: /mark as processed/i });
    await user.click(markAsProcessedButtons[0]);

    await waitFor(() => {
      expect(mockUpdateWebhookEvent).toHaveBeenCalledWith(1, { processed: true });
    });
  });

  it('should toggle unprocessed status when button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('abc123XYZ')).toBeInTheDocument();
    });

    const markAsUnprocessedButtons = screen.getAllByRole('button', { name: /mark as unprocessed/i });
    if (markAsUnprocessedButtons.length > 0) {
      await user.click(markAsUnprocessedButtons[0]);

      await waitFor(() => {
        expect(mockUpdateWebhookEvent).toHaveBeenCalledWith(2, { processed: false });
      });
    }
  });

  it('should display empty state when no events are found', async () => {
    mockGetWebhookEvents.mockResolvedValue({
      items: [],
      total: 0,
      limit: 20,
      offset: 0,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/no webhook events found/i)).toBeInTheDocument();
    });
  });

  it('should refresh data when refresh button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('dQw4w9WgXcQ')).toBeInTheDocument();
    });

    mockGetWebhookEvents.mockClear();

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    await waitFor(() => {
      expect(mockGetWebhookEvents).toHaveBeenCalled();
    });
  });

  it('should handle search with Enter key', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('dQw4w9WgXcQ')).toBeInTheDocument();
    });

    const videoIdInput = screen.getByPlaceholderText(/filter by video id/i);
    await user.type(videoIdInput, 'testVideoId{Enter}');

    await waitFor(() => {
      expect(mockGetWebhookEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          video_id: 'testVideoId',
        })
      );
    });
  });
});
