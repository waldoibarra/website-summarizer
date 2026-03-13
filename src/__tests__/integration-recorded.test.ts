import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import nock from 'nock';

describe('Real API Integration Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    nock.cleanAll();
    nock.disableNetConnect();
    process.env = { ...originalEnv, OPENROUTER_API_KEY: 'test-api-key' };
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
    process.env = originalEnv;
  });

  describe('Successful API Response', () => {
    it('should successfully parse summary from API response', async () => {
      // Set up nock to intercept the request and return a fixture
      const scope = nock('https://openrouter.ai')
        .post('/api/v1/chat/completions')
        .reply(200, {
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
        });

      const { summarize } = await import('../summarizer.js');
      const result = await summarize('Test content to summarize');

      expect(result.summary).toBe('This is a test summary of the page content.');
      expect(result.model).toBe('openrouter/free');
      expect(result.tokensUsed).toBe(150);

      scope.done();
    });

    it('should use the default model from constants', async () => {
      const scope = nock('https://openrouter.ai')
        .post('/api/v1/chat/completions')
        .reply(200, {
          choices: [
            {
              message: {
                content: 'Summary with default model',
              },
            },
          ],
          usage: {
            total_tokens: 100,
          },
        });

      const { summarize } = await import('../summarizer.js');
      const result = await summarize('Content');

      // Verify the model used was the default
      expect(result.model).toBe('openrouter/free');

      scope.done();
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 unauthorized error', async () => {
      const scope = nock('https://openrouter.ai')
        .post('/api/v1/chat/completions')
        .reply(401, {
          error: {
            message: 'Invalid API key',
          },
        });

      const { summarize } = await import('../summarizer.js');

      await expect(summarize('Test content')).rejects.toThrow('API error');

      scope.done();
    });

    it('should handle 429 rate limit error', async () => {
      // For rate limit, the summarizer retries, so we need to allow multiple calls
      const scope = nock('https://openrouter.ai')
        .post('/api/v1/chat/completions')
        .times(3) // Allow up to 3 retries
        .reply(429, {
          error: {
            message: 'Rate limit exceeded',
          },
        });

      const { summarize } = await import('../summarizer.js');

      await expect(summarize('Test content')).rejects.toThrow('Rate limited');

      scope.done();
    });

    it('should handle 500 server error', async () => {
      const scope = nock('https://openrouter.ai')
        .post('/api/v1/chat/completions')
        .reply(500, {
          error: {
            message: 'Internal server error',
          },
        });

      const { summarize } = await import('../summarizer.js');

      await expect(summarize('Test content')).rejects.toThrow('API error: 500');

      scope.done();
    });
  });

  describe('Response Parsing', () => {
    it('should correctly parse summary content', async () => {
      const scope = nock('https://openrouter.ai')
        .post('/api/v1/chat/completions')
        .reply(200, {
          choices: [
            {
              message: {
                content: 'Parsed summary content',
              },
            },
          ],
          usage: {
            total_tokens: 200,
          },
        });

      const { summarize } = await import('../summarizer.js');
      const result = await summarize('Long content here');

      expect(result.summary).toBe('Parsed summary content');
      expect(typeof result.summary).toBe('string');
      expect(result.summary.length).toBeGreaterThan(0);

      scope.done();
    });

    it('should correctly parse tokensUsed', async () => {
      const scope = nock('https://openrouter.ai')
        .post('/api/v1/chat/completions')
        .reply(200, {
          choices: [
            {
              message: {
                content: 'Summary',
              },
            },
          ],
          usage: {
            total_tokens: 500,
          },
        });

      const { summarize } = await import('../summarizer.js');
      const result = await summarize('Content');

      expect(result.tokensUsed).toBe(500);

      scope.done();
    });

    it('should use custom model when specified', async () => {
      const scope = nock('https://openrouter.ai')
        .post('/api/v1/chat/completions')
        .reply(200, {
          choices: [
            {
              message: {
                content: 'Summary from custom model',
              },
            },
          ],
          usage: {
            total_tokens: 100,
          },
        });

      const { summarize } = await import('../summarizer.js');
      const result = await summarize('Content', { url: 'https://example.com', model: 'custom/model' });

      expect(result.model).toBe('custom/model');

      scope.done();
    });
  });
});

