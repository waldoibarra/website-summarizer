import { describe, it, expect } from 'vitest';
import { ValidationError } from '../errors.js';
import { BrowserError } from '../errors.js';
import { ExtractionError } from '../errors.js';
import { SummarizationError } from '../errors.js';

describe('Error Classes', () => {
  describe('ValidationError', () => {
    it('should have correct name and message', () => {
      const error = new ValidationError('Invalid URL format');
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid URL format');
    });

    it('should be instance of Error', () => {
      const error = new ValidationError('Invalid URL');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('BrowserError', () => {
    it('should have correct name and message', () => {
      const error = new BrowserError('Failed to load page');
      expect(error.name).toBe('BrowserError');
      expect(error.message).toBe('Failed to load page');
    });

    it('should accept optional cause', () => {
      const cause = new Error('Network error');
      const error = new BrowserError('Failed to load page', cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe('ExtractionError', () => {
    it('should have correct name and message', () => {
      const error = new ExtractionError('No content found');
      expect(error.name).toBe('ExtractionError');
      expect(error.message).toBe('No content found');
    });

    it('should be instance of Error', () => {
      const error = new ExtractionError('No content');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('SummarizationError', () => {
    it('should have correct name and message', () => {
      const error = new SummarizationError('API rate limit exceeded');
      expect(error.name).toBe('SummarizationError');
      expect(error.message).toBe('API rate limit exceeded');
    });

    it('should accept optional cause', () => {
      const cause = new Error('HTTP 429');
      const error = new SummarizationError('Rate limited', cause);
      expect(error.cause).toBe(cause);
    });
  });
});
