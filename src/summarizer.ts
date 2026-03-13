import type { SummarizerOptions, SummaryResult } from './types.js';
import { SummarizationError } from './errors.js';

const DEFAULT_MODEL = 'openrouter/free';
const DEFAULT_MAX_LENGTH = 8000;
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s

// Prompts - extracted for maintainability
const SYSTEM_PROMPT =
  'You are a helpful assistant that summarizes web page content. Provide a concise summary of the following text.';
const USER_PROMPT_PREFIX = 'Please summarize this web page content:\n\n';

const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';

/**
 * Generate a summary for the given text using OpenRouter API
 * @param text - The text content to summarize
 * @param options - Optional configuration
 * @returns SummaryResult with the summary and metadata
 * @throws SummarizationError if summarization fails
 */
export async function summarize(
  text: string,
  options?: SummarizerOptions
): Promise<SummaryResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new SummarizationError(
      'Error: OPENROUTER_API_KEY environment variable is required'
    );
  }

  const model = options?.model ?? DEFAULT_MODEL;
  const maxLength = options?.maxLength ?? DEFAULT_MAX_LENGTH;

  // Truncate text if too long
  let truncatedText = text;
  if (text.length > maxLength) {
    truncatedText = text.substring(0, maxLength);
  }

  // Retry logic with exponential backoff
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${OPENROUTER_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com',
          'X-Title': 'Website Summarizer',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: USER_PROMPT_PREFIX + truncatedText,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        // Handle rate limiting
        if (response.status === 429) {
          if (attempt < MAX_RETRIES - 1) {
            // Wait before retrying
            await new Promise((resolve) =>
              setTimeout(resolve, RETRY_DELAYS[attempt])
            );
            continue;
          }
          throw new SummarizationError(`Rate limited. Please try again later.`);
        }

        throw new SummarizationError(
          `API error: ${response.status} - ${errorText}`
        );
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { total_tokens?: number };
      };

      const choice = data.choices?.[0];
      if (!choice || !choice.message) {
        throw new SummarizationError('No response from AI API');
      }

      const summary = choice.message.content || 'No summary generated';
      const tokensUsed = data.usage?.total_tokens || 0;

      return {
        summary,
        model,
        tokensUsed,
      };
    } catch (error) {
      if (error instanceof SummarizationError) {
        throw error;
      }

      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if it's a rate limit
      if (
        lastError.message.includes('429') ||
        lastError.message.includes('rate limit')
      ) {
        if (attempt < MAX_RETRIES - 1) {
          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_DELAYS[attempt])
          );
          continue;
        }
      }

      // For other errors, don't retry
      break;
    }
  }

  throw new SummarizationError(
    `AI summarization failed: ${lastError?.message || 'Unknown error'}`,
    lastError
  );
}
