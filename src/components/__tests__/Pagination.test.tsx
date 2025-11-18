import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '../Pagination';

describe('Pagination', () => {
  const mockOnPageChange = vi.fn();

  it('should render pagination info', () => {
    render(
      <Pagination
        currentPage={1}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    );
    expect(screen.getByText(/Showing 1 to 20 of 100 results/i)).toBeInTheDocument();
  });

  it('should render current page info', () => {
    render(
      <Pagination
        currentPage={2}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    );
    expect(screen.getByText(/Page 2 of 5/i)).toBeInTheDocument();
  });

  it('should disable Previous button on first page', () => {
    render(
      <Pagination
        currentPage={1}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    );
    const prevButton = screen.getByRole('button', { name: /previous/i });
    expect(prevButton).toBeDisabled();
  });

  it('should disable Next button on last page', () => {
    render(
      <Pagination
        currentPage={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    );
    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();
  });

  it('should call onPageChange when clicking Previous', async () => {
    const user = userEvent.setup();
    render(
      <Pagination
        currentPage={2}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    );
    const prevButton = screen.getByRole('button', { name: /previous/i });
    await user.click(prevButton);
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it('should call onPageChange when clicking Next', async () => {
    const user = userEvent.setup();
    render(
      <Pagination
        currentPage={1}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    );
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('should not render when totalPages is 1', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalItems={10}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should calculate end item correctly on last page', () => {
    render(
      <Pagination
        currentPage={5}
        totalItems={95}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    );
    expect(screen.getByText(/Showing 81 to 95 of 95 results/i)).toBeInTheDocument();
  });
});
