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
    $(
      'script, style, nav, header, footer, aside, .sidebar, .advertisement, .ad, .comments, .social-share, .related-articles'
    ).remove();

    // Extract main content - iterate through child elements to preserve structure
    let text = '';

    const contentSelectors = [
      'article',
      'main',
      'div.content',
      'div.main',
      'div.article',
      '[role="main"]',
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let $content: cheerio.Cheerio<any> | null = null;

    for (const selector of contentSelectors) {
      const $el = $(selector).first();
      if ($el.length) {
        $content = $el;
        break;
      }
    }

    if ($content && $content.length) {
      const paragraphs: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      $content
        .find('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre')
        .each((_i: number, el: any) => {
          const elText = $(el).text().trim();
          if (elText) {
            paragraphs.push(elText);
          }
        });

      // If no specific elements found, get all text
      if (paragraphs.length === 0) {
        text = $content.text();
      } else {
        text = paragraphs.join('\n\n');
      }
    }

    // Final fallback: try to get any text from body (not html, to avoid getting title)
    if (!text || !text.trim()) {
      text = $('body').text();
    }

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
    throw new ExtractionError(
      `Failed to extract content: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Process pre-extracted content from browser (with Shadow DOM support)
 * Applies cleaning, formatting, and truncation
 * @param content - Content already extracted via page.evaluate()
 * @param url - The original URL
 * @returns Processed ExtractedContent
 */
export function processExtractedContent(
  content: { title: string; text: string },
  url: string
): ExtractedContent {
  let { title, text } = content;

  // Title fallback logic
  if (!title || !title.trim()) {
    // Title extraction will be handled by extractContent fallback if needed
    // For now, leave empty string
    title = '';
  }

  // Clean up extra whitespace while preserving paragraph structure
  text = text
    .split('\n\n')
    .map((block) => block.replace(/\s+/g, ' ').trim())
    .filter((block) => block.length > 0)
    .join('\n\n');

  // Truncate if too long
  if (text.length > MAX_CONTENT_LENGTH) {
    text = text.substring(0, MAX_CONTENT_LENGTH);
  }

  return {
    title: title.trim(),
    text,
    url,
  };
}
