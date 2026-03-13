import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Playwright module - must be before imports
vi.mock('playwright', async () => {
  const mockPage = {
    goto: vi.fn().mockResolvedValue(undefined),
    waitForLoadState: vi.fn().mockResolvedValue(undefined),
    content: vi.fn().mockResolvedValue('<html><body><h1>Test Page</h1><p>Content here</p></body></html>'),
    close: vi.fn().mockResolvedValue(undefined),
    setExtraHTTPHeaders: vi.fn().mockResolvedValue(undefined),
  };

  const mockBrowser = {
    newPage: vi.fn().mockResolvedValue(mockPage),
    close: vi.fn().mockResolvedValue(undefined),
  };

  return {
    chromium: {
      launch: vi.fn().mockResolvedValue(mockBrowser),
    },
  };
});

import { fetchPage } from '../browser.js';

describe('Browser Module', () => {
  describe('fetchPage', () => {
    it('should fetch HTML from a valid URL', async () => {
      const html = await fetchPage('https://example.com');
      expect(html).toContain('<html');
      expect(html).toContain('Test Page');
    });

    it('should throw BrowserError for invalid URL', async () => {
      await expect(fetchPage('not-a-url')).rejects.toThrow('Invalid URL');
    });

    it('should throw BrowserError on page load failure', async () => {
      const { chromium } = await import('playwright');
      
      // Make the mock reject
      vi.mocked(chromium.launch).mockRejectedValueOnce(new Error('Navigation failed'));
      
      await expect(fetchPage('https://example.com')).rejects.toThrow();
      
      // Reset mock
      vi.mocked(chromium.launch).mockResolvedValue({
        newPage: vi.fn().mockResolvedValue({
          goto: vi.fn().mockResolvedValue(undefined),
          waitForLoadState: vi.fn().mockResolvedValue(undefined),
          content: vi.fn().mockResolvedValue('<html><body></body></html>'),
          close: vi.fn().mockResolvedValue(undefined),
          setExtraHTTPHeaders: vi.fn().mockResolvedValue(undefined),
        }),
        close: vi.fn().mockResolvedValue(undefined),
      });
    });

    it('should handle timeout', async () => {
      const { chromium } = await import('playwright');
      
      // Make launch reject with timeout error
      vi.mocked(chromium.launch).mockRejectedValueOnce(new Error('Request timed out after 30000ms'));
      
      await expect(fetchPage('https://example.com')).rejects.toThrow('timed out');
      
      // Reset mock
      vi.mocked(chromium.launch).mockResolvedValue({
        newPage: vi.fn().mockResolvedValue({
          goto: vi.fn().mockResolvedValue(undefined),
          waitForLoadState: vi.fn().mockResolvedValue(undefined),
          content: vi.fn().mockResolvedValue('<html><body></body></html>'),
          close: vi.fn().mockResolvedValue(undefined),
          setExtraHTTPHeaders: vi.fn().mockResolvedValue(undefined),
        }),
        close: vi.fn().mockResolvedValue(undefined),
      });
    });
  });
});
