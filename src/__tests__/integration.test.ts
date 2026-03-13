import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateUrl } from '../validation.js';
import { extractContent } from '../extractor.js';

// Mock the browser module
vi.mock('../browser.js', () => ({
  fetchPage: vi.fn(),
}));

// Mock the summarizer module
vi.mock('../summarizer.js', () => ({
  summarize: vi.fn(),
}));

import { fetchPage } from '../browser.js';
import { summarize } from '../summarizer.js';
import { program } from '../index.js';

describe('Integration: Full CLI Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('URL Validation to Content Extraction', () => {
    it('should validate URL and extract content from HTML', () => {
      // Test the validation + extraction flow
      const url = 'https://example.com';
      const validatedUrl = validateUrl(url);

      expect(validatedUrl).toBe('https://example.com');

      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Test Page</title></head>
          <body>
            <h1>Welcome</h1>
            <p>This is test content for integration testing.</p>
          </body>
        </html>
      `;

      const extracted = extractContent(html, validatedUrl);

      expect(extracted.title).toBe('Test Page');
      expect(extracted.text).toContain('Welcome');
      expect(extracted.text).toContain('test content');
    });

    it('should handle complex HTML with multiple elements', () => {
      const url = 'https://example.com';
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Complex Page</title></head>
          <body>
            <header><h1>Main Title</h1></header>
            <nav><ul><li>Link 1</li><li>Link 2</li></ul></nav>
            <main>
              <article>
                <h2>Article Title</h2>
                <p>First paragraph with <strong>important</strong> content.</p>
                <p>Second paragraph with more details.</p>
              </article>
              <aside>Sidebar content here</aside>
            </main>
            <footer>Footer info</footer>
          </body>
        </html>
      `;

      const extracted = extractContent(html, url);

      expect(extracted.title).toBe('Complex Page');
      // The extractor prioritizes article content
      expect(extracted.text).toContain('Article Title');
      expect(extracted.text).toContain('First paragraph');
    });

    it('should extract content from pages with minimal content', () => {
      const url = 'https://example.com';
      const html = '<html><body><p>Short</p></body></html>';

      const extracted = extractContent(html, url);

      expect(extracted.text).toBeDefined();
      expect(extracted.text.length).toBeGreaterThan(0);
    });
  });

  describe('Full Flow with Mocked External Services', () => {
    it('should complete full flow when API is mocked', async () => {
      const mockFetchPage = vi.mocked(fetchPage);
      const mockSummarize = vi.mocked(summarize);

      // Setup mocks
      mockFetchPage.mockResolvedValue(`
        <!DOCTYPE html>
        <html>
          <head><title>Mock Page</title></head>
          <body>
            <h1>Mock Content</h1>
            <p>This is mocked content for testing.</p>
          </body>
        </html>
      `);

      mockSummarize.mockResolvedValue({
        summary: 'This is a mock summary of the page.',
        model: 'google/gemini-2.0-flash-001',
        tokensUsed: 100,
      });

      // Execute the flow
      const url = 'https://example.com';
      const validatedUrl = validateUrl(url);
      const html = await fetchPage(validatedUrl);
      const extracted = extractContent(html, validatedUrl);
      const result = await summarize(extracted.text, { url: validatedUrl });

      // Verify
      expect(validatedUrl).toBe('https://example.com');
      expect(html).toContain('Mock Content');
      expect(extracted.text).toContain('Mock Content');
      expect(result.summary).toBe('This is a mock summary of the page.');
      expect(result.model).toBe('google/gemini-2.0-flash-001');
    });

    it('should handle API errors gracefully in the flow', async () => {
      const mockFetchPage = vi.mocked(fetchPage);
      const mockSummarize = vi.mocked(summarize);

      mockFetchPage.mockResolvedValue(`
        <!DOCTYPE html>
        <html><body><p>Content</p></body></html>
      `);

      mockSummarize.mockRejectedValue(new Error('API rate limited'));

      const url = 'https://example.com';
      const validatedUrl = validateUrl(url);
      const html = await fetchPage(validatedUrl);
      const extracted = extractContent(html, validatedUrl);

      await expect(
        summarize(extracted.text, { url: validatedUrl })
      ).rejects.toThrow('API rate limited');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid URL at start of flow', () => {
      expect(() => validateUrl('not-a-url')).toThrow();
    });

    it('should handle empty HTML gracefully', () => {
      const url = 'https://example.com';
      const extracted = extractContent('', url);

      expect(extracted.text).toBe('');
      expect(extracted.title).toBe('');
    });

    it('should handle malformed HTML gracefully', () => {
      const url = 'https://example.com';
      const extracted = extractContent('<div>Unclosed tags', url);

      expect(extracted.text).toBeDefined();
    });
  });

  describe('Content Processing Pipeline', () => {
    it('should process content through extraction with various options', () => {
      const url = 'https://example.com';
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Test</title></head>
          <body>
            <h1>Title</h1>
            <p>First paragraph.</p>
            <p>Second paragraph.</p>
          </body>
        </html>
      `;

      const extracted = extractContent(html, url);

      // Verify content is extracted and usable
      expect(extracted.text.length).toBeGreaterThan(10);
      expect(extracted.text).toMatch(/Title|First|Second/);
    });

    it('should preserve important content structure', () => {
      const url = 'https://example.com';
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Structure Test</title></head>
          <body>
            <article>
              <h2>Section 1</h2>
              <p>Content for section 1.</p>
            </article>
            <article>
              <h2>Section 2</h2>
              <p>Content for section 2.</p>
            </article>
          </body>
        </html>
      `;

      const extracted = extractContent(html, url);

      // The extractor may prioritize first article
      expect(extracted.text).toContain('Section 1');
      expect(extracted.text).toContain('Content for section 1');
    });
  });
});
