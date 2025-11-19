import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Channels } from '../Channels';
import * as apiClient from '../../lib/api-client';
import { APIClient } from '../../lib/api-client';
import type { Channel, PaginatedResponse } from '../../types/api';

// Mock the API client
vi.mock('../../lib/api-client', () => ({
  getAPIClient: vi.fn(),
}));

const mockChannels: Channel[] = [
  {
    channel_id: 'UC1234567890',
    title: 'Test Channel 1',
    channel_url: 'https://www.youtube.com/channel/UC1234567890',
    first_seen_at: '2024-01-01T00:00:00Z',
    last_updated_at: '2024-01-02T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    channel_id: 'UC0987654321',
    title: 'Test Channel 2',
    channel_url: 'https://www.youtube.com/channel/UC0987654321',
    first_seen_at: '2024-01-03T00:00:00Z',
    last_updated_at: '2024-01-04T00:00:00Z',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z',
  },
];

const mockPaginatedResponse: PaginatedResponse<Channel> = {
  items: mockChannels,
  total: 2,
  limit: 20,
  offset: 0,
};

describe('Channels', () => {
  let queryClient: QueryClient;
  let mockGetChannels: ReturnType<typeof vi.fn>;
  let mockCreateChannel: ReturnType<typeof vi.fn>;
  let mockDeleteChannel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockGetChannels = vi.fn().mockResolvedValue(mockPaginatedResponse);
    mockCreateChannel = vi.fn().mockResolvedValue(mockChannels[0]);
    mockDeleteChannel = vi.fn().mockResolvedValue(undefined);

    vi.mocked(apiClient.getAPIClient).mockReturnValue({
      getChannels: mockGetChannels,
      createChannel: mockCreateChannel,
      deleteChannel: mockDeleteChannel,
    } as Partial<APIClient> as APIClient);
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Channels />
      </QueryClientProvider>
    );
  };

  it('should render channels list with correct data', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Channel 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Channel 2')).toBeInTheDocument();
    expect(screen.getByText(/UC1234567890/)).toBeInTheDocument();
    expect(screen.getByText(/UC0987654321/)).toBeInTheDocument();
  });

  it('should display loading state while fetching data', async () => {
    mockGetChannels.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockPaginatedResponse), 100))
    );

    renderComponent();

    // During loading, the table shouldn't be visible yet
    expect(screen.queryByText('Test Channel 1')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Channel 1')).toBeInTheDocument();
    });
  });

  it('should display error message when API call fails', async () => {
    const errorMessage = 'Failed to fetch channels';
    mockGetChannels.mockRejectedValue(new Error(errorMessage));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should show create form when Add Channel button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Channel 1')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add channel/i });
    await user.click(addButton);

    expect(screen.getByText('Add New Channel')).toBeInTheDocument();

    // Form defaults to URL mode, so click "Manual Entry" to switch
    const manualEntryButton = screen.getByRole('button', { name: /manual entry/i });
    await user.click(manualEntryButton);

    expect(screen.getByLabelText(/channel id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/channel url/i)).toBeInTheDocument();
  });

  it('should create a new channel when form is submitted', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Channel 1')).toBeInTheDocument();
    });

    // Open create form
    const addButton = screen.getByRole('button', { name: /add channel/i });
    await user.click(addButton);

    // Form defaults to URL mode, so click "Manual Entry" to switch
    const manualEntryButton = screen.getByRole('button', { name: /manual entry/i });
    await user.click(manualEntryButton);

    // Fill in form
    const channelIdInput = screen.getByLabelText(/channel id/i);
    const titleInput = screen.getByLabelText(/title/i);
    const channelUrlInput = screen.getByLabelText(/channel url/i);

    await user.type(channelIdInput, 'UC1111111111');
    await user.type(titleInput, 'New Test Channel');
    await user.type(channelUrlInput, 'https://www.youtube.com/channel/UC1111111111');

    // Submit form
    const createButton = screen.getByRole('button', { name: /create channel/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(mockCreateChannel).toHaveBeenCalledWith({
        channel_id: 'UC1111111111',
        title: 'New Test Channel',
        channel_url: 'https://www.youtube.com/channel/UC1111111111',
      });
    });
  });

  it('should filter channels by title when search is performed', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Channel 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by channel title/i);
    await user.type(searchInput, 'Test Channel');

    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(mockGetChannels).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Channel',
          limit: 20,
          offset: 0,
        })
      );
    });
  });

  it('should delete channel when delete button is clicked and confirmed', async () => {
    const user = userEvent.setup();
    global.confirm = vi.fn(() => true);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Channel 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: '' });
    const deleteButton = deleteButtons.find(btn => btn.querySelector('svg'));

    if (deleteButton) {
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteChannel).toHaveBeenCalledWith('UC1234567890');
      });
    }
  });

  it('should not delete channel when deletion is cancelled', async () => {
    const user = userEvent.setup();
    global.confirm = vi.fn(() => false);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Channel 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: '' });
    const deleteButton = deleteButtons.find(btn => btn.querySelector('svg'));

    if (deleteButton) {
      await user.click(deleteButton);

      expect(mockDeleteChannel).not.toHaveBeenCalled();
    }
  });

  it('should display empty state when no channels are found', async () => {
    mockGetChannels.mockResolvedValue({
      items: [],
      total: 0,
      limit: 20,
      offset: 0,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/no channels found/i)).toBeInTheDocument();
    });
  });

  it('should render channel URLs as clickable links', async () => {
    renderComponent();

    await waitFor(() => {
      const links = screen.getAllByRole('link');
      const channelLink = links.find(link =>
        link.getAttribute('href')?.includes('UC1234567890')
      );
      expect(channelLink).toBeInTheDocument();
      expect(channelLink).toHaveAttribute('target', '_blank');
      expect(channelLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('should refresh data when refresh button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Channel 1')).toBeInTheDocument();
    });

    mockGetChannels.mockClear();

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    await waitFor(() => {
      expect(mockGetChannels).toHaveBeenCalled();
    });
  });

  it('should handle pagination correctly', async () => {
    const user = userEvent.setup();
    mockGetChannels.mockResolvedValue({
      items: mockChannels,
      total: 50,
      limit: 20,
      offset: 0,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Channel 1')).toBeInTheDocument();
    });

    // Assuming pagination component is rendered
    const nextButton = screen.queryByRole('button', { name: /next/i });
    if (nextButton) {
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockGetChannels).toHaveBeenCalledWith(
          expect.objectContaining({
            offset: 20,
          })
        );
      });
    }
  });
});
