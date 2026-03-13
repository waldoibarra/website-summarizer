import { describe, it, expect } from 'vitest';
import { isValidUrl, validateUrl } from '../validation.js';

describe('URL Validation', () => {
  describe('isValidUrl', () => {
    it('should return true for valid HTTPS URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('https://www.example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=value')).toBe(true);
    });

    it('should return true for valid HTTP URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
    });

    it('should return false for URLs without protocol', () => {
      expect(isValidUrl('www.example.com')).toBe(false);
      expect(isValidUrl('//example.com')).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('should return the URL if valid', () => {
      const result = validateUrl('https://example.com');
      expect(result).toBe('https://example.com');
    });

    it('should throw ValidationError for invalid URLs', () => {
      expect(() => validateUrl('invalid')).toThrow();
      expect(() => validateUrl('')).toThrow();
    });
  });
});
