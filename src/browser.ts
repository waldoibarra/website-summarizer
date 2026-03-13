import { chromium, Browser, Page } from 'playwright';
import { BrowserError } from './errors.js';
import { isValidUrl } from './validation.js';
import type { ExtractedContent } from './types.js';

let browser: Browser | null = null;

/**
 * Fetch a webpage using Playwright headless browser
 * @param url - The URL to fetch
 * @returns The rendered HTML content
 * @throws BrowserError if fetching fails
 */
export async function fetchPage(url: string): Promise<string> {
  // Validate URL first
  if (!isValidUrl(url)) {
    throw new BrowserError(
      'Invalid URL provided. Please provide a valid HTTP or HTTPS URL.'
    );
  }

  try {
    // Launch browser with stealth configuration
    browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    const page: Page = await browser.newPage();

    // Set a realistic user agent
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });

    // Navigate to the URL with timeout
    await page.goto(url, {
      timeout: 30000,
      waitUntil: 'networkidle',
    });

    // Get the rendered HTML
    const html = await page.content();

    // Clean up
    await page.close();
    await browser.close();
    browser = null;

    return html;
  } catch (error) {
    // Clean up on error
    if (browser) {
      try {
        await browser.close();
      } catch {
        // Ignore cleanup errors
      }
      browser = null;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('net::ERR')) {
      throw new BrowserError(
        'Failed to load page. The site may be unreachable or blocking requests.'
      );
    }

    if (message.includes('timeout')) {
      throw new BrowserError('Failed to fetch page: Request timed out.');
    }

    throw new BrowserError(
      `Failed to fetch page: ${message}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Extract page content directly in the browser, handling Shadow DOM
 * @param url - The URL to fetch
 * @returns ExtractedContent with title and text
 * @throws BrowserError if extraction fails
 */
export async function extractPageContent(
  url: string
): Promise<ExtractedContent> {
  if (!isValidUrl(url)) {
    throw new BrowserError(
      'Invalid URL provided. Please provide a valid HTTP or HTTPS URL.'
    );
  }

  let browserInstance: Browser | null = null;

  try {
    browserInstance = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    const page: Page = await browserInstance.newPage();

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });

    await page.goto(url, {
      timeout: 30000,
      waitUntil: 'networkidle',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extracted = await (page.evaluate as any)(() => {
      const UNWANTED = [
        'script',
        'style',
        'noscript',
        'template',
        'nav',
        'header',
        'footer',
        'aside',
        'iframe',
        'noembed',
        'noframes',
      ];

      function isUnwanted(el: any): boolean {
        const tag = el.tagName?.toLowerCase() || '';
        return (
          UNWANTED.includes(tag) ||
          el.classList?.contains('sidebar') ||
          el.classList?.contains('advertisement') ||
          el.classList?.contains('ad') ||
          el.classList?.contains('comments') ||
          el.getAttribute?.('role') === 'navigation' ||
          el.getAttribute?.('aria-hidden') === 'true' ||
          el.hasAttribute?.('hidden')
        );
      }

      function isHidden(el: any): boolean {
        const style = window.getComputedStyle(el);
        return (
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          style.opacity === '0' ||
          el.hasAttribute?.('hidden')
        );
      }

      function getTextContent(node: any, depth: number): string {
        if (depth > 20) return '';
        if (node.nodeType === node.TEXT_NODE) {
          const text = node.textContent?.trim();
          return text ? text + ' ' : '';
        }
        if (node.nodeType !== node.ELEMENT_NODE) return '';

        const el = node;
        if (isUnwanted(el) || isHidden(el)) return '';

        let text = '';

        if (el.shadowRoot) {
          for (const child of el.shadowRoot.childNodes) {
            text += getTextContent(child, depth + 1);
          }
        }

        for (const child of el.childNodes) {
          text += getTextContent(child, depth + 1);
        }

        return text;
      }

      function getStructuredText(): string {
        const blocks: string[] = [];

        function traverse(node: any, depth: number): void {
          if (depth > 20) return;
          if (node.nodeType !== node.ELEMENT_NODE) return;

          const el = node;
          if (isUnwanted(el) || isHidden(el)) return;

          const tag = el.tagName?.toLowerCase() || '';
          if (
            tag.match(/^h[1-6]$/) ||
            tag === 'p' ||
            tag === 'li' ||
            tag === 'blockquote' ||
            tag === 'pre'
          ) {
            const text = getTextContent(el, depth).trim();
            if (text) blocks.push(text);
          }

          if (el.shadowRoot) {
            for (const child of el.shadowRoot.childNodes) {
              traverse(child, depth + 1);
            }
          }

          for (const child of el.childNodes) {
            traverse(child, depth + 1);
          }
        }

        traverse(document.body, 0);
        return blocks.join('\n\n');
      }

      return {
        title: document.title,
        text: getStructuredText(),
      };
    });

    await page.close();
    await browserInstance.close();

    return {
      title: extracted.title,
      text: extracted.text,
      url,
    };
  } catch (error) {
    if (browserInstance) {
      try {
        await browserInstance.close();
      } catch {
        // Ignore cleanup errors
      }
    }

    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('net::ERR')) {
      throw new BrowserError(
        'Failed to load page. The site may be unreachable or blocking requests.'
      );
    }

    if (message.includes('timeout')) {
      throw new BrowserError('Failed to fetch page: Request timed out.');
    }

    throw new BrowserError(
      `Failed to extract page content: ${message}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Close the browser - useful for cleanup
 */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
