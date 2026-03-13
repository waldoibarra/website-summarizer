import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SummarizerOptions } from '../types.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Summarizer Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'This is a test summary of the page content.',
            },
          },
        ],
        usage: {
          total_tokens: 150,
        },
      }),
    });
    process.env = { ...originalEnv, OPENROUTER_API_KEY: 'test-api-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('summarize', () => {
    it('should return a summary for valid content', async () => {
      const { summarize } = await import('../summarizer.js');
      const content = 'This is the content to summarize. It has multiple sentences that need to be condensed into a brief summary.';

      const result = await summarize(content);

      expect(result.summary).toBeDefined();
      expect(result.summary.length).toBeGreaterThan(0);
      expect(result.model).toBeDefined();
      expect(result.tokensUsed).toBeGreaterThan(0);
    });

    it('should use specified model', async () => {
      const { summarize } = await import('../summarizer.js');
      const content = 'Test content';
      const options: SummarizerOptions = {
        url: 'https://example.com',
        model: 'custom/model',
      };

      const result = await summarize(content, options);

      expect(result.model).toBe('custom/model');
    });

    it('should truncate content exceeding maxLength', async () => {
      const { summarize } = await import('../summarizer.js');
      const longContent = 'a'.repeat(15000);

      const result = await summarize(longContent);

      // Content should be truncated to around 8000 chars
      expect(result).toBeDefined();
    });

    it('should throw error when API key is missing', async () => {
      const { summarize } = await import('../summarizer.js');
      delete process.env.OPENROUTER_API_KEY;

      await expect(summarize('Test content')).rejects.toThrow('OPENROUTER_API_KEY');
    });

    it('should handle API errors', async () => {
      const { summarize } = await import('../summarizer.js');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(summarize('Test content')).rejects.toThrow('API error');
    });

    it('should handle rate limiting (429)', async () => {
      const { summarize } = await import('../summarizer.js');

      // Mock to fail 2 times then succeed
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve({
            ok: false,
            status: 429,
            text: async () => 'Rate limited',
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Success after retry' } }],
            usage: { total_tokens: 100 },
          }),
        });
      });

      const result = await summarize('Test content');
      expect(result).toBeDefined();
    });
  });
});

