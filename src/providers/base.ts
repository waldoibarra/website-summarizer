import type {
  SummarizerOptions,
  SummaryResult,
  LLMProvider,
} from '../types.js';
import { ProviderType } from '../types.js';
import { SummarizationError } from '../errors.js';

// Shared constants
export const SYSTEM_PROMPT =
  'You are a snarky assistant that summarizes web page content.';
export const USER_PROMPT_PREFIX = 'Please summarize this web page content:\n\n';
export const DEFAULT_MAX_LENGTH = 8000;

/**
 * Truncate text to max length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length > maxLength) {
    return text.substring(0, maxLength);
  }
  return text;
}

/**
 * Build messages for chat completion API
 */
export function buildMessages(text: string): Array<{
  role: 'system' | 'user';
  content: string;
}> {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: USER_PROMPT_PREFIX + text },
  ];
}

/**
 * Parse chat completion response
 */
export function parseChatCompletionResponse(data: unknown): {
  summary: string;
  tokensUsed: number;
} {
  const response = data as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
  };

  const choice = response.choices?.[0];
  if (!choice || !choice.message) {
    throw new SummarizationError('No response from AI API');
  }

  const summary = choice.message.content || 'No summary generated';
  const tokensUsed = response.usage?.total_tokens || 0;

  return { summary, tokensUsed };
}

/**
 * Handle API errors - returns error to be caught by retry logic
 */
export function handleApiError(response: Response, errorText: string): Error {
  // Add "Rate limited" message for 429 errors
  if (response.status === 429) {
    return new SummarizationError(`Rate limited. ${errorText}`);
  }
  // Don't throw for 429 - let the retry logic handle it
  // The catch block checks for "429" in error messages to retry
  return new SummarizationError(`API error: ${response.status} - ${errorText}`);
}

/**
 * Base class for LLM providers using OpenAI-compatible API
 */
export abstract class BaseLLMProvider implements LLMProvider {
  abstract getProviderType(): ProviderType;

  /**
   * Get the base URL for the API
   */
  protected abstract getBaseUrl(): string;

  /**
   * Get headers for the API request
   */
  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get the API key (if required)
   */
  protected getApiKey?(): string | undefined;

  /**
   * Make a chat completion request
   */
  protected async makeChatCompletionRequest(
    model: string,
    messages: Array<{ role: 'system' | 'user'; content: string }>,
    maxRetries = 3,
    retryDelays = [1000, 2000, 4000]
  ): Promise<{ summary: string; tokensUsed: number }> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const headers = this.getHeaders();
        const apiKey = this.getApiKey?.();
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const response = await fetch(
          `${this.getBaseUrl()}/chat/completions`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              model,
              messages,
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw handleApiError(response, errorText);
        }

        const data = await response.json();
        return parseChatCompletionResponse(data);
      } catch (error) {
        // Check if it's a retryable error before deciding to throw
        const isRetryable =
          error instanceof SummarizationError &&
          (error.message.includes('429') ||
            error.message.toLowerCase().includes('rate limit'));

        if (isRetryable) {
          lastError = error instanceof Error ? error : new Error(String(error));
          if (attempt < maxRetries - 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, retryDelays[attempt])
            );
            continue;
          }
          // Exhausted retries - throw the error immediately
          throw lastError;
        }

        // For non-retryable SummarizationErrors or other errors, throw immediately
        if (error instanceof SummarizationError) {
          throw error;
        }

        lastError = error instanceof Error ? error : new Error(String(error));
        break;
      }
    }

    throw new SummarizationError(
      `AI summarization failed: ${lastError?.message || 'Unknown error'}`,
      lastError
    );
  }

  /**
   * Summarize text - implemented by subclasses
   */
  async summarize(
    text: string,
    options?: SummarizerOptions
  ): Promise<SummaryResult> {
    const model = options?.model || this.getDefaultModel();
    const maxLength = options?.maxLength || DEFAULT_MAX_LENGTH;

    const truncatedText = truncateText(text, maxLength);
    const messages = buildMessages(truncatedText);

    const { summary, tokensUsed } = await this.makeChatCompletionRequest(
      model,
      messages
    );

    return {
      summary,
      model,
      tokensUsed,
    };
  }

  /**
   * Get the default model - implemented by subclasses
   */
  protected abstract getDefaultModel(): string;
}
