import type { APIConfig } from '../types/api';

/**
 * Storage keys for API configuration
 */
const STORAGE_KEYS = {
  API_BASE_URL: 'yt_webhook_api_base_url',
  API_KEY: 'yt_webhook_api_key',
} as const;

/**
 * Simple encryption/decryption using base64 encoding
 * Note: This provides obfuscation, not true encryption.
 * For production, consider using Web Crypto API for stronger encryption.
 */
function encode(value: string): string {
  return btoa(encodeURIComponent(value));
}

function decode(value: string): string {
  try {
    return decodeURIComponent(atob(value));
  } catch {
    return '';
  }
}

/**
 * Saves API configuration to session storage (secure, cleared on tab close)
 */
export function saveAPIConfig(config: APIConfig): void {
  try {
    sessionStorage.setItem(STORAGE_KEYS.API_BASE_URL, encode(config.baseURL));
    sessionStorage.setItem(STORAGE_KEYS.API_KEY, encode(config.apiKey));
  } catch (error) {
    console.error('Failed to save API configuration:', error);
    throw new Error('Failed to save API configuration to storage');
  }
}

/**
 * Loads API configuration from session storage
 */
export function loadAPIConfig(): APIConfig | null {
  try {
    const baseURL = sessionStorage.getItem(STORAGE_KEYS.API_BASE_URL);
    const apiKey = sessionStorage.getItem(STORAGE_KEYS.API_KEY);

    if (!baseURL || !apiKey) {
      return null;
    }

    return {
      baseURL: decode(baseURL),
      apiKey: decode(apiKey),
    };
  } catch (error) {
    console.error('Failed to load API configuration:', error);
    return null;
  }
}

/**
 * Clears API configuration from storage
 */
export function clearAPIConfig(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.API_BASE_URL);
    sessionStorage.removeItem(STORAGE_KEYS.API_KEY);
  } catch (error) {
    console.error('Failed to clear API configuration:', error);
  }
}

/**
 * Checks if API configuration exists in storage
 */
export function hasAPIConfig(): boolean {
  try {
    return !!(
      sessionStorage.getItem(STORAGE_KEYS.API_BASE_URL) &&
      sessionStorage.getItem(STORAGE_KEYS.API_KEY)
    );
  } catch {
    return false;
  }
}
