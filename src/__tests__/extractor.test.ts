import { describe, it, expect } from 'vitest';
import { extractContent, processExtractedContent } from '../extractor.js';
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
      const titleOnlyHtml =
        '<html><head><title>Test Title</title></head><body></body></html>';
      const result = extractContent(titleOnlyHtml, 'https://example.com');
      expect(result.title).toBe('Test Title');
      expect(result.text).toBe('');
    });
  });

  describe('processExtractedContent', () => {
    it('should process content extracted from browser', () => {
      const rawContent = {
        title: 'Test Page Title',
        text: 'This is a paragraph.\n\nThis is another paragraph.',
      };
      const result = processExtractedContent(rawContent, 'https://example.com');
      expect(result.title).toBe('Test Page Title');
      expect(result.text).toContain('This is a paragraph');
      expect(result.text).toContain('This is another paragraph');
      expect(result.url).toBe('https://example.com');
    });

    it('should handle empty title', () => {
      const rawContent = {
        title: '',
        text: 'Some content here.',
      };
      const result = processExtractedContent(rawContent, 'https://example.com');
      expect(result.title).toBe('');
      expect(result.text).toBe('Some content here.');
    });

    it('should handle content with excessive whitespace', () => {
      const rawContent = {
        title: 'Test',
        text: '  Multiple   spaces   here.  \n\n  More   text  ',
      };
      const result = processExtractedContent(rawContent, 'https://example.com');
      expect(result.text).toBe('Multiple spaces here.\n\nMore text');
    });

    it('should handle empty text', () => {
      const rawContent = {
        title: 'Test',
        text: '',
      };
      const result = processExtractedContent(rawContent, 'https://example.com');
      expect(result.text).toBe('');
    });

    it('should filter out empty blocks', () => {
      const rawContent = {
        title: 'Test',
        text: 'Valid paragraph.\n\n   \n\nAnother one.',
      };
      const result = processExtractedContent(rawContent, 'https://example.com');
      expect(result.text).toBe('Valid paragraph.\n\nAnother one.');
    });

    it('should truncate content at 8000 characters', () => {
      const rawContent = {
        title: 'Test',
        text: 'a'.repeat(10000),
      };
      const result = processExtractedContent(rawContent, 'https://example.com');
      expect(result.text.length).toBeLessThanOrEqual(8000);
    });

    it('should preserve paragraph structure', () => {
      const rawContent = {
        title: 'Test',
        text: 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.',
      };
      const result = processExtractedContent(rawContent, 'https://example.com');
      expect(result.text.split('\n\n').length).toBe(3);
    });
  });
});
