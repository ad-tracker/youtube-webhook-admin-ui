import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorMessage } from '../ErrorMessage';

describe('ErrorMessage', () => {
  it('should render error message with default title', () => {
    render(<ErrorMessage message="Something went wrong" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render error message with custom title', () => {
    render(<ErrorMessage title="Custom Error" message="Custom message" />);
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
    expect(screen.getByText('Custom message')).toBeInTheDocument();
  });

  it('should have role="alert"', () => {
    const { container } = render(<ErrorMessage message="Test error" />);
    const alert = container.querySelector('[role="alert"]');
    expect(alert).toBeInTheDocument();
  });

  it('should render AlertCircle icon', () => {
    const { container } = render(<ErrorMessage message="Test error" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
