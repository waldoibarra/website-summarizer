import { describe, it, expect } from 'vitest';
import type {
  SummarizerOptions,
  ExtractedContent,
  SummaryResult,
} from '../types.js';

describe('TypeScript Types', () => {
  describe('SummarizerOptions', () => {
    it('should have required url property', () => {
      const options: SummarizerOptions = {
        url: 'https://example.com',
      };
      expect(options.url).toBe('https://example.com');
    });

    it('should accept optional model property', () => {
      const options: SummarizerOptions = {
        url: 'https://example.com',
        model: 'google/gemini-2.0-flash-001',
      };
      expect(options.model).toBe('google/gemini-2.0-flash-001');
    });

    it('should accept optional maxLength property', () => {
      const options: SummarizerOptions = {
        url: 'https://example.com',
        maxLength: 5000,
      };
      expect(options.maxLength).toBe(5000);
    });
  });

  describe('ExtractedContent', () => {
    it('should have title, text, and url properties', () => {
      const content: ExtractedContent = {
        title: 'Example Domain',
        text: 'This is example content',
        url: 'https://example.com',
      };
      expect(content.title).toBe('Example Domain');
      expect(content.text).toBe('This is example content');
      expect(content.url).toBe('https://example.com');
    });
  });

  describe('SummaryResult', () => {
    it('should have summary, model, and tokensUsed properties', () => {
      const result: SummaryResult = {
        summary: 'This is a summary',
        model: 'google/gemini-2.0-flash-001',
        tokensUsed: 100,
      };
      expect(result.summary).toBe('This is a summary');
      expect(result.model).toBe('google/gemini-2.0-flash-001');
      expect(result.tokensUsed).toBe(100);
    });
  });
});
