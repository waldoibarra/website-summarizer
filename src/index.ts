#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import { fetchPage } from './browser.js';
import { extractContent } from './extractor.js';
import { summarize } from './summarizer.js';
import { validateUrl } from './validation.js';
import { ValidationError, BrowserError, ExtractionError, SummarizationError } from './errors.js';

export const program = new Command();

program
  .name('website-summarizer')
  .description('CLI tool to summarize websites using AI via OpenRouter')
  .version('1.0.0')
  .argument('[url]', 'The website URL to summarize')
  .option('-m, --model <model>', 'AI model to use', 'openrouter/free')
  .option('-l, --max-length <n>', 'Maximum characters to send to AI', '8000')
  .action(async (url: string | undefined, options: { model?: string; maxLength?: string }) => {
    // If no URL provided, show help and exit with code 0
    if (!url) {
      program.help();
      process.exit(0);
    }
    try {
      // Validate URL
      const validatedUrl = validateUrl(url);
      
      console.log(`Fetching ${validatedUrl}...`);
      
      // Fetch page with headless browser
      const html = await fetchPage(validatedUrl);
      
      console.log('Extracting content...');
      
      // Extract content
      const extracted = extractContent(html, validatedUrl);
      
      if (!extracted.text || extracted.text.length < 100) {
        console.warn('Warning: The page has minimal content. The summary may not be accurate.');
      }
      
      console.log('Generating summary...');
      
      // Generate summary
      const result = await summarize(extracted.text, {
        url: validatedUrl,
        model: options.model,
        maxLength: parseInt(options.maxLength || '8000', 10),
      });
      
      // Output summary
      console.log('\n--- Summary ---\n');
      console.log(result.summary);
      console.log('\n---');
      console.log(`Model: ${result.model}`);
      console.log(`Tokens used: ${result.tokensUsed}`);
      
      process.exit(0);
    } catch (error) {
      // Handle errors with user-friendly messages
      if (error instanceof ValidationError) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
      } else if (error instanceof BrowserError) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
      } else if (error instanceof ExtractionError) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
      } else if (error instanceof SummarizationError) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
      } else if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
      } else {
        console.error('An unexpected error occurred');
        process.exit(1);
      }
    }
  });

// Execute the program only when run directly
// Check if this is being run as a CLI (not imported as a module)
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}
