#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import { extractPageContent } from './browser.js';
import { processExtractedContent } from './extractor.js';
import { ProviderType } from './summarizer.js';
import { createLLMProvider } from './providers/index.js';
import { validateUrl } from './validation.js';
import {
  ValidationError,
  BrowserError,
  ExtractionError,
  SummarizationError,
} from './errors.js';

export const program = new Command();

program
  .name('website-summarizer')
  .description('CLI tool to summarize websites using AI (OpenRouter or Ollama)')
  .version('1.0.0')
  .argument('[url]', 'The website URL to summarize')
  .option('-m, --model <model>', 'AI model to use', 'openrouter/free')
  .option('-l, --max-length <n>', 'Maximum characters to send to AI', '8000')
  .option(
    '-p, --provider <type>',
    'AI provider (openrouter or ollama)',
    'openrouter'
  )
  .action(
    async (
      url: string | undefined,
      options: { model?: string; maxLength?: string; provider?: string }
    ) => {
      // If no URL provided, show help and exit with code 0
      if (!url) {
        program.help();
        process.exit(0);
      }

      // Validate provider type
      const providerArg = options.provider?.toLowerCase();
      let providerType: ProviderType;

      if (providerArg === 'ollama') {
        providerType = ProviderType.OLLAMA;
      } else if (providerArg === 'openrouter' || !providerArg) {
        providerType = ProviderType.OPENROUTER;
      } else {
        console.error(
          `Error: Invalid provider '${options.provider}'. Valid options are: openrouter, ollama`
        );
        process.exit(1);
      }

      try {
        // Validate URL
        const validatedUrl = validateUrl(url);

        console.log(`Fetching ${validatedUrl}...`);

        // Extract page content directly in browser (handles Shadow DOM)
        const rawContent = await extractPageContent(validatedUrl);

        console.log('Processing content...');

        // Process and clean the extracted content
        const extracted = processExtractedContent(rawContent, validatedUrl);

        if (!extracted.text || extracted.text.length < 100) {
          console.warn(
            'Warning: The page has minimal content. The summary may not be accurate.'
          );
        }

        console.log('Generating summary...');

        // Generate summary using factory
        const provider = createLLMProvider(providerType);
        const result = await provider.summarize(extracted.text, {
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
    }
  );

// Execute the program when run directly
program.parse(process.argv);
