import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Jobs } from '../Jobs';
import * as apiClient from '../../lib/api-client';
import type { EnrichmentJob, PaginatedResponse } from '../../types/api';

// Mock the API client module
vi.mock('../../lib/api-client');

// Helper to create mock jobs
const createMockJob = (overrides: Partial<EnrichmentJob> = {}): EnrichmentJob => ({
  id: 1,
  asynq_task_id: 'task-123',
  job_type: 'video_enrichment',
  video_id: 'dQw4w9WgXcQ',
  status: 'pending',
  priority: 5,
  scheduled_at: '2025-01-15T10:00:00Z',
  started_at: null,
  completed_at: null,
  attempts: 0,
  max_attempts: 3,
  next_retry_at: null,
  error_message: null,
  error_stack_trace: null,
  metadata: null,
  created_at: '2025-01-15T09:00:00Z',
  updated_at: '2025-01-15T09:00:00Z',
  ...overrides,
});

// Helper to wrap component with providers
const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('Jobs', () => {
  let mockGetJobs: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGetJobs = vi.fn();
    vi.mocked(apiClient.getAPIClient).mockReturnValue({
      getJobs: mockGetJobs,
    } as unknown as apiClient.APIClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title and description', async () => {
    const mockResponse: PaginatedResponse<EnrichmentJob> = {
      items: [],
      total: 0,
      limit: 20,
      offset: 0,
    };

    mockGetJobs.mockResolvedValue(mockResponse);

    renderWithProviders(<Jobs />);

    expect(screen.getByText('Enrichment Jobs')).toBeInTheDocument();
    expect(screen.getByText(/Monitor and track enrichment job queue status/i)).toBeInTheDocument();
  });

  it('displays loading spinner while fetching data', () => {
    mockGetJobs.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<Jobs />);

    // LoadingSpinner is shown while data is loading
    expect(screen.getByText('Enrichment Jobs')).toBeInTheDocument();
    // The spinner SVG should be present (has animate-spin class)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('displays jobs in a table when data is loaded', async () => {
    const mockJobs = [
      createMockJob({
        id: 1,
        video_id: 'video1',
        status: 'pending',
        priority: 5,
      }),
      createMockJob({
        id: 2,
        video_id: 'video2',
        status: 'completed',
        priority: 10,
        started_at: '2025-01-15T10:05:00Z',
        completed_at: '2025-01-15T10:10:00Z',
      }),
    ];

    const mockResponse: PaginatedResponse<EnrichmentJob> = {
      items: mockJobs,
      total: 2,
      limit: 20,
      offset: 0,
    };

    mockGetJobs.mockResolvedValue(mockResponse);

    renderWithProviders(<Jobs />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    expect(screen.getByText('video1')).toBeInTheDocument();
    expect(screen.getByText('video2')).toBeInTheDocument();
  });

  it('displays status badges with correct variants', async () => {
    const mockJobs = [
      createMockJob({ id: 1, status: 'pending' }),
      createMockJob({ id: 2, status: 'processing' }),
      createMockJob({ id: 3, status: 'completed' }),
      createMockJob({ id: 4, status: 'failed', error_message: 'Test error' }),
      createMockJob({ id: 5, status: 'cancelled' }),
    ];

    const mockResponse: PaginatedResponse<EnrichmentJob> = {
      items: mockJobs,
      total: 5,
      limit: 20,
      offset: 0,
    };

    mockGetJobs.mockResolvedValue(mockResponse);

    renderWithProviders(<Jobs />);

    await waitFor(() => {
      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('processing')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('failed')).toBeInTheDocument();
      expect(screen.getByText('cancelled')).toBeInTheDocument();
    });
  });

  it('filters jobs by status when dropdown is changed', async () => {
    const user = userEvent.setup({ delay: null });

    const mockAllResponse: PaginatedResponse<EnrichmentJob> = {
      items: [createMockJob()],
      total: 1,
      limit: 20,
      offset: 0,
    };

    mockGetJobs.mockResolvedValue(mockAllResponse);

    renderWithProviders(<Jobs />);

    await waitFor(() => {
      expect(screen.getByText('video_enrichment')).toBeInTheDocument();
    });

    // Change filter to "completed"
    const statusSelect = screen.getByLabelText('Status');
    await user.selectOptions(statusSelect, 'completed');

    await waitFor(() => {
      expect(mockGetJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
        })
      );
    });
  });

  it('displays error message when API call fails', async () => {
    const errorMessage = 'Failed to fetch jobs';
    mockGetJobs.mockRejectedValue(new Error(errorMessage));

    renderWithProviders(<Jobs />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('displays empty state when no jobs are found', async () => {
    const mockResponse: PaginatedResponse<EnrichmentJob> = {
      items: [],
      total: 0,
      limit: 20,
      offset: 0,
    };

    mockGetJobs.mockResolvedValue(mockResponse);

    renderWithProviders(<Jobs />);

    await waitFor(() => {
      expect(screen.getByText(/No jobs found matching the current filters/i)).toBeInTheDocument();
    });
  });

  it('shows expandable error details for failed jobs', async () => {
    const user = userEvent.setup({ delay: null });

    const mockJobs = [
      createMockJob({
        id: 1,
        status: 'failed',
        error_message: 'API quota exceeded',
        error_stack_trace: 'Error: API quota exceeded\n    at enrichVideo (/app/enricher.js:123:45)',
      }),
    ];

    const mockResponse: PaginatedResponse<EnrichmentJob> = {
      items: mockJobs,
      total: 1,
      limit: 20,
      offset: 0,
    };

    mockGetJobs.mockResolvedValue(mockResponse);

    renderWithProviders(<Jobs />);

    await waitFor(() => {
      expect(screen.getByText('View Error')).toBeInTheDocument();
    });

    // Error details should not be visible initially
    expect(screen.queryByText('API quota exceeded')).not.toBeInTheDocument();

    // Click to expand error details
    const viewErrorButton = screen.getByText('View Error');
    await user.click(viewErrorButton);

    // Error details should now be visible
    expect(screen.getByText('API quota exceeded')).toBeInTheDocument();
    expect(screen.getByText(/Error: API quota exceeded/)).toBeInTheDocument();
  });

  it('handles pagination correctly', async () => {
    const user = userEvent.setup({ delay: null });

    const mockPage1: PaginatedResponse<EnrichmentJob> = {
      items: [createMockJob({ id: 1 })],
      total: 25, // More than one page
      limit: 20,
      offset: 0,
    };

    mockGetJobs.mockResolvedValue(mockPage1);

    renderWithProviders(<Jobs />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    // Click next page button
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(mockGetJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 20,
        })
      );
    });
  });

  it('refreshes data when refresh button is clicked', async () => {
    const user = userEvent.setup({ delay: null });

    const mockResponse: PaginatedResponse<EnrichmentJob> = {
      items: [createMockJob()],
      total: 1,
      limit: 20,
      offset: 0,
    };

    mockGetJobs.mockResolvedValue(mockResponse);

    renderWithProviders(<Jobs />);

    await waitFor(() => {
      expect(screen.getByText('video_enrichment')).toBeInTheDocument();
    });

    // Initial call
    expect(mockGetJobs).toHaveBeenCalledTimes(1);

    // Click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    // Should have been called again
    await waitFor(() => {
      expect(mockGetJobs).toHaveBeenCalledTimes(2);
    });
  });

  it('displays attempts count correctly', async () => {
    const mockJobs = [
      createMockJob({
        id: 1,
        attempts: 2,
        max_attempts: 3,
      }),
    ];

    const mockResponse: PaginatedResponse<EnrichmentJob> = {
      items: mockJobs,
      total: 1,
      limit: 20,
      offset: 0,
    };

    mockGetJobs.mockResolvedValue(mockResponse);

    renderWithProviders(<Jobs />);

    await waitFor(() => {
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });
  });

  it('shows auto-refresh indicator for pending/processing jobs', async () => {
    const mockResponse: PaginatedResponse<EnrichmentJob> = {
      items: [createMockJob({ status: 'pending' })],
      total: 1,
      limit: 20,
      offset: 0,
    };

    mockGetJobs.mockResolvedValue(mockResponse);

    renderWithProviders(<Jobs />);

    await waitFor(() => {
      expect(screen.getByText(/Auto-refreshing every 10 seconds/i)).toBeInTheDocument();
    });
  });

  it('hides auto-refresh indicator for completed jobs filter', async () => {
    const user = userEvent.setup({ delay: null });

    const mockResponse: PaginatedResponse<EnrichmentJob> = {
      items: [],
      total: 0,
      limit: 20,
      offset: 0,
    };

    mockGetJobs.mockResolvedValue(mockResponse);

    renderWithProviders(<Jobs />);

    await waitFor(() => {
      expect(screen.getByText(/Auto-refreshing every 10 seconds/i)).toBeInTheDocument();
    });

    // Change filter to "completed"
    const statusSelect = screen.getByLabelText('Status');
    await user.selectOptions(statusSelect, 'completed');

    await waitFor(() => {
      expect(screen.queryByText(/Auto-refreshing every 10 seconds/i)).not.toBeInTheDocument();
    });
  });

  it('displays job with null timestamps correctly', async () => {
    const mockJobs = [
      createMockJob({
        id: 1,
        started_at: null,
        completed_at: null,
      }),
    ];

    const mockResponse: PaginatedResponse<EnrichmentJob> = {
      items: mockJobs,
      total: 1,
      limit: 20,
      offset: 0,
    };

    mockGetJobs.mockResolvedValue(mockResponse);

    renderWithProviders(<Jobs />);

    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(within(table).getAllByText('N/A')).toHaveLength(2); // started_at and completed_at
    });
  });
});
