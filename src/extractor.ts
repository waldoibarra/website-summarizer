import * as cheerio from 'cheerio';
import type { ExtractedContent } from './types.js';
import { ExtractionError } from './errors.js';

const MAX_CONTENT_LENGTH = 8000;

/**
 * Extract content from HTML using Cheerio
 * @param html - The HTML string to parse
 * @param url - The original URL
 * @returns ExtractedContent with title and text
 */
export function extractContent(html: string, url: string): ExtractedContent {
  try {
    const $ = cheerio.load(html);

    // Extract title - prefer title tag, fallback to h1
    let title = '';
    if ($('title').text()) {
      title = $('title').text().trim();
    } else if ($('article h1').text()) {
      title = $('article h1').text().trim();
    } else if ($('h1').first().text()) {
      title = $('h1').first().text().trim();
    }

    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .sidebar, .advertisement, .ad, .comments, .social-share, .related-articles').remove();

    // Extract main content
    let text = '';
    
    // Try to find main content in semantic elements
    const $article = $('article').first();
    if ($article.length) {
      text = $article.text();
    } else {
      const $main = $('main').first();
      if ($main.length) {
        text = $main.text();
      } else {
        // Fallback to body
        text = $('body').text();
      }
    }

    // Clean up the text
    text = text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();

    // Truncate if too long
    if (text.length > MAX_CONTENT_LENGTH) {
      text = text.substring(0, MAX_CONTENT_LENGTH);
    }

    return {
      title,
      text,
      url,
    };
  } catch (error) {
    throw new ExtractionError(`Failed to extract content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
