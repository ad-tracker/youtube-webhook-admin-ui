import { describe, it, expect } from 'vitest';
import { cn, formatDate, truncate, safeJsonParse } from '../utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      const result = cn('text-sm', 'text-red-500');
      expect(result).toBe('text-sm text-red-500');
    });

    it('should handle conditional classes', () => {
      const result = cn('text-sm', false && 'hidden', 'block');
      expect(result).toBe('text-sm block');
    });

    it('should merge conflicting Tailwind classes', () => {
      const result = cn('px-2 py-1', 'px-4');
      expect(result).toContain('px-4');
    });
  });

  describe('formatDate', () => {
    it('should format valid date string', () => {
      const result = formatDate('2024-01-15T10:30:00Z');
      expect(result).toMatch(/Jan.*2024/);
    });

    it('should return N/A for null', () => {
      expect(formatDate(null)).toBe('N/A');
    });

    it('should return N/A for undefined', () => {
      expect(formatDate(undefined)).toBe('N/A');
    });

    it('should return Invalid Date for invalid date string', () => {
      expect(formatDate('not-a-date')).toBe('Invalid Date');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      const result = truncate('This is a very long string that should be truncated', 20);
      expect(result).toBe('This is a very long ...');
      expect(result.length).toBe(23); // 20 + '...'
    });

    it('should not truncate short strings', () => {
      const result = truncate('Short', 20);
      expect(result).toBe('Short');
    });

    it('should handle null', () => {
      expect(truncate(null, 20)).toBe('');
    });

    it('should handle undefined', () => {
      expect(truncate(undefined, 20)).toBe('');
    });

    it('should handle exact length strings', () => {
      const result = truncate('Exactly20Characters!', 20);
      expect(result).toBe('Exactly20Characters!');
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"key":"value"}', {});
      expect(result).toEqual({ key: 'value' });
    });

    it('should return fallback for invalid JSON', () => {
      const fallback = { default: true };
      const result = safeJsonParse('invalid json', fallback);
      expect(result).toEqual(fallback);
    });

    it('should return fallback for null', () => {
      const fallback = { default: true };
      const result = safeJsonParse(null, fallback);
      expect(result).toEqual(fallback);
    });

    it('should return fallback for undefined', () => {
      const fallback = { default: true };
      const result = safeJsonParse(undefined, fallback);
      expect(result).toEqual(fallback);
    });

    it('should parse arrays', () => {
      const result = safeJsonParse('[1,2,3]', []);
      expect(result).toEqual([1, 2, 3]);
    });
  });
});
