import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { APIConfigForm } from '../APIConfigForm';

// Mock the useAPI hook
vi.mock('../../contexts/APIContext', async () => {
  const actual = await vi.importActual('../../contexts/APIContext');
  return {
    ...actual,
    useAPI: () => ({
      configure: vi.fn(),
      isConfigured: false,
      clearConfig: vi.fn(),
      config: null,
    }),
  };
});

describe('APIConfigForm', () => {
  it('should render form with title and inputs', () => {
    render(<APIConfigForm />);
    expect(screen.getByText('YouTube Webhook Admin')).toBeInTheDocument();
    expect(screen.getByLabelText(/API Base URL/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/API Key/i)).toBeInTheDocument();
  });

  it('should have default base URL', () => {
    render(<APIConfigForm />);
    const input = screen.getByLabelText(/API Base URL/i) as HTMLInputElement;
    expect(input.value).toBe('http://localhost:8000');
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<APIConfigForm />);

    const submitButton = screen.getByRole('button', { name: /connect to api/i });

    // Clear the base URL
    const baseURLInput = screen.getByLabelText(/API Base URL/i);
    await user.clear(baseURLInput);
    await user.click(submitButton);

    expect(screen.getByText(/API Base URL is required/i)).toBeInTheDocument();
  });

  it('should validate API key is required', async () => {
    const user = userEvent.setup();
    render(<APIConfigForm />);

    const submitButton = screen.getByRole('button', { name: /connect to api/i });
    await user.click(submitButton);

    expect(screen.getByText(/API Key is required/i)).toBeInTheDocument();
  });

  it.skip('should validate URL format', async () => {
    const user = userEvent.setup();
    const mockConfigure = vi.fn();

    vi.mocked(await import('../../contexts/APIContext')).useAPI = () => ({
      configure: mockConfigure,
      isConfigured: false,
      clearConfig: vi.fn(),
      config: null,
    });

    render(<APIConfigForm />);

    const baseURLInput = screen.getByLabelText(/API Base URL/i);
    const apiKeyInput = screen.getByLabelText(/API Key/i);
    const submitButton = screen.getByRole('button', { name: /connect to api/i });

    await user.clear(baseURLInput);
    await user.type(baseURLInput, 'invalid');
    await user.type(apiKeyInput, 'test-key');
    await user.click(submitButton);

    // Should show validation error and not call configure
    expect(screen.getByText(/Please enter a valid URL/i)).toBeInTheDocument();
    expect(mockConfigure).not.toHaveBeenCalled();
  });

  it('should update input values when typing', async () => {
    const user = userEvent.setup();
    render(<APIConfigForm />);

    const apiKeyInput = screen.getByLabelText(/API Key/i) as HTMLInputElement;
    await user.type(apiKeyInput, 'my-secret-key');

    expect(apiKeyInput.value).toBe('my-secret-key');
  });

  it('should have password type for API key input', () => {
    render(<APIConfigForm />);
    const apiKeyInput = screen.getByLabelText(/API Key/i);
    expect(apiKeyInput).toHaveAttribute('type', 'password');
  });
});
