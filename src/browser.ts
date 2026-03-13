import { chromium, Browser, Page } from 'playwright';
import { BrowserError } from './errors.js';
import { isValidUrl } from './validation.js';

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
    throw new BrowserError('Invalid URL provided. Please provide a valid HTTP or HTTPS URL.');
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
      throw new BrowserError('Failed to load page. The site may be unreachable or blocking requests.');
    }
    
    if (message.includes('timeout')) {
      throw new BrowserError('Failed to fetch page: Request timed out.');
    }

    throw new BrowserError(`Failed to fetch page: ${message}`, error instanceof Error ? error : undefined);
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
