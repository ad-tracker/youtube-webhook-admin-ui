import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Videos } from '../Videos';
import * as apiClient from '../../lib/api-client';
import { APIClient } from '../../lib/api-client';
import type { Video, PaginatedResponse } from '../../types/api';

vi.mock('../../lib/api-client', () => ({
  getAPIClient: vi.fn(),
}));

const mockVideos: Video[] = [
  {
    video_id: 'dQw4w9WgXcQ',
    channel_id: 'UC1234567890',
    title: 'Test Video 1',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    published_at: '2024-01-01T00:00:00Z',
    first_seen_at: '2024-01-01T00:00:00Z',
    last_updated_at: '2024-01-02T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    video_id: 'abc123XYZ',
    channel_id: 'UC0987654321',
    title: 'Test Video 2',
    video_url: 'https://www.youtube.com/watch?v=abc123XYZ',
    published_at: '2024-01-03T00:00:00Z',
    first_seen_at: '2024-01-03T00:00:00Z',
    last_updated_at: '2024-01-04T00:00:00Z',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z',
  },
];

const mockPaginatedResponse: PaginatedResponse<Video> = {
  items: mockVideos,
  total: 2,
  limit: 20,
  offset: 0,
};

describe('Videos', () => {
  let queryClient: QueryClient;
  let mockGetVideos: ReturnType<typeof vi.fn>;
  let mockCreateVideo: ReturnType<typeof vi.fn>;
  let mockDeleteVideo: ReturnType<typeof vi.fn>;
  let mockEnqueueVideoEnrichment: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockGetVideos = vi.fn().mockResolvedValue(mockPaginatedResponse);
    mockCreateVideo = vi.fn().mockResolvedValue(mockVideos[0]);
    mockDeleteVideo = vi.fn().mockResolvedValue(undefined);
    mockEnqueueVideoEnrichment = vi.fn().mockResolvedValue({ status: 'enqueued', video_id: 'dQw4w9WgXcQ' });

    vi.mocked(apiClient.getAPIClient).mockReturnValue({
      getVideos: mockGetVideos,
      createVideo: mockCreateVideo,
      deleteVideo: mockDeleteVideo,
      enqueueVideoEnrichment: mockEnqueueVideoEnrichment,
    } as Partial<APIClient> as APIClient);
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Videos />
      </QueryClientProvider>
    );
  };

  it('should render videos list with correct data', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Video 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Video 2')).toBeInTheDocument();
    expect(screen.getByText(/dQw4w9WgXcQ/)).toBeInTheDocument();
    expect(screen.getByText(/abc123XYZ/)).toBeInTheDocument();
  });

  it('should display loading state while fetching data', async () => {
    mockGetVideos.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockPaginatedResponse), 100))
    );

    renderComponent();

    // During loading, the table shouldn't be visible yet
    expect(screen.queryByText('Test Video 1')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Video 1')).toBeInTheDocument();
    });
  });

  it('should display error message when API call fails', async () => {
    const errorMessage = 'Failed to fetch videos';
    mockGetVideos.mockRejectedValue(new Error(errorMessage));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should show create form when Add Video button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Video 1')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add video/i });
    await user.click(addButton);

    expect(screen.getByText('Add New Video')).toBeInTheDocument();
    expect(screen.getByLabelText(/video id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/channel id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/video url/i)).toBeInTheDocument();
  });

  it('should create a new video when form is submitted', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Video 1')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add video/i });
    await user.click(addButton);

    const videoIdInput = screen.getByLabelText(/video id/i);
    const channelIdInput = screen.getByLabelText(/channel id/i);
    const titleInput = screen.getByLabelText(/title/i);
    const videoUrlInput = screen.getByLabelText(/video url/i);

    await user.type(videoIdInput, 'newVideoId123');
    await user.type(channelIdInput, 'UC1111111111');
    await user.type(titleInput, 'New Test Video');
    await user.type(videoUrlInput, 'https://www.youtube.com/watch?v=newVideoId123');

    const createButton = screen.getByRole('button', { name: /create video/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(mockCreateVideo).toHaveBeenCalledWith(
        expect.objectContaining({
          video_id: 'newVideoId123',
          channel_id: 'UC1111111111',
          title: 'New Test Video',
          video_url: 'https://www.youtube.com/watch?v=newVideoId123',
        })
      );
    });
  });

  it('should filter videos by title when search is performed', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Video 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by title/i);
    await user.type(searchInput, 'Test Video');

    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(mockGetVideos).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Video',
          limit: 20,
          offset: 0,
        })
      );
    });
  });

  it('should filter videos by channel ID', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Video 1')).toBeInTheDocument();
    });

    const channelInput = screen.getByPlaceholderText(/filter by channel id/i);
    await user.type(channelInput, 'UC1234567890');

    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(mockGetVideos).toHaveBeenCalledWith(
        expect.objectContaining({
          channel_id: 'UC1234567890',
        })
      );
    });
  });

  it('should delete video when delete button is clicked and confirmed', async () => {
    const user = userEvent.setup();
    global.confirm = vi.fn(() => true);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Video 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete video');
    const deleteButton = deleteButtons[0];

    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteVideo).toHaveBeenCalledWith('dQw4w9WgXcQ');
    });
  });

  it('should display empty state when no videos are found', async () => {
    mockGetVideos.mockResolvedValue({
      items: [],
      total: 0,
      limit: 20,
      offset: 0,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/no videos found/i)).toBeInTheDocument();
    });
  });

  it('should render video URLs as clickable links', async () => {
    renderComponent();

    await waitFor(() => {
      const links = screen.getAllByRole('link');
      const videoLink = links.find(link =>
        link.getAttribute('href')?.includes('dQw4w9WgXcQ')
      );
      expect(videoLink).toBeInTheDocument();
      expect(videoLink).toHaveAttribute('target', '_blank');
      expect(videoLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('should format dates correctly', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Video 1')).toBeInTheDocument();
    });

    // Check that dates are being formatted (the actual format depends on formatDate utility)
    const dateElements = screen.getAllByText(/2024/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('should close create form when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Video 1')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add video/i });
    await user.click(addButton);

    expect(screen.getByText('Add New Video')).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Add New Video')).not.toBeInTheDocument();
    });
  });

  it('should enqueue video enrichment when enrichment button is clicked and confirmed', async () => {
    const user = userEvent.setup();
    global.confirm = vi.fn(() => true);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Video 1')).toBeInTheDocument();
    });

    const enrichButton = screen.getAllByTitle('Queue video enrichment')[0];

    await user.click(enrichButton);

    await waitFor(() => {
      expect(mockEnqueueVideoEnrichment).toHaveBeenCalledWith('dQw4w9WgXcQ');
    });
  });

  it('should not enqueue video enrichment when enrichment is cancelled', async () => {
    const user = userEvent.setup();
    global.confirm = vi.fn(() => false);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Video 1')).toBeInTheDocument();
    });

    const enrichButton = screen.getAllByTitle('Queue video enrichment')[0];

    await user.click(enrichButton);

    expect(mockEnqueueVideoEnrichment).not.toHaveBeenCalled();
  });
});
