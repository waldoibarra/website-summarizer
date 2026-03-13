import { describe, it, expect } from 'vitest';
import { extractContent } from '../extractor.js';
import type { ExtractedContent } from '../types.js';
import * as fs from 'fs';
import * as path from 'path';

const sampleHtml = fs.readFileSync(
  path.join(import.meta.dirname, 'fixtures', 'sample.html'),
  'utf-8'
);

describe('Content Extraction', () => {
  describe('extractContent', () => {
    it('should extract title from HTML', () => {
      const result = extractContent(sampleHtml, 'https://example.com');
      expect(result.title).toBe('Sample Article - Tech News');
    });

    it('should extract body text content', () => {
      const result = extractContent(sampleHtml, 'https://example.com');
      expect(result.text).toContain('Artificial intelligence');
      expect(result.text).toContain('Machine learning algorithms');
    });

    it('should exclude navigation content', () => {
      const result = extractContent(sampleHtml, 'https://example.com');
      expect(result.text).not.toContain('Home');
      expect(result.text).not.toContain('About');
      expect(result.text).not.toContain('Contact');
    });

    it('should exclude footer content', () => {
      const result = extractContent(sampleHtml, 'https://example.com');
      expect(result.text).not.toContain('Privacy Policy');
      expect(result.text).not.toContain('Terms of Service');
      expect(result.text).not.toContain('All rights reserved');
    });

    it('should return the original URL', () => {
      const result = extractContent(sampleHtml, 'https://example.com/page');
      expect(result.url).toBe('https://example.com/page');
    });

    it('should handle empty HTML', () => {
      const emptyHtml = '<html><body></body></html>';
      const result = extractContent(emptyHtml, 'https://example.com');
      expect(result.text).toBe('');
    });

    it('should truncate content at 8000 characters', () => {
      const longHtml = `<html><body><article><p>${'a'.repeat(10000)}</p></article></body></html>`;
      const result = extractContent(longHtml, 'https://example.com');
      expect(result.text.length).toBeLessThanOrEqual(8000);
    });

    it('should handle HTML with only title', () => {
      const titleOnlyHtml = '<html><head><title>Test Title</title></head><body></body></html>';
      const result = extractContent(titleOnlyHtml, 'https://example.com');
      expect(result.title).toBe('Test Title');
      expect(result.text).toBe('');
    });
  });
});

