import type {
  SummarizerOptions,
  SummaryResult,
  LLMProvider,
} from '../types.js';
import { ProviderType } from '../types.js';
import { SummarizationError } from '../errors.js';

const DEFAULT_MODEL = 'llama3.2'; // Default Ollama model
const DEFAULT_MAX_LENGTH = 8000;
const DEFAULT_OLLAMA_URL = 'http://localhost:11434';

/**
 * Ollama provider implementation
 */
export class OllamaProvider implements LLMProvider {
  private baseUrl: string;
  private timeout: number;

  constructor(options?: { baseUrl?: string; timeout?: number }) {
    // Allow OLLAMA_BASE_URL env var or constructor option
    this.baseUrl =
      process.env.OLLAMA_BASE_URL || options?.baseUrl || DEFAULT_OLLAMA_URL;
    this.timeout = options?.timeout || 30000; // 30 second default timeout
  }

  getProviderType(): ProviderType {
    return ProviderType.OLLAMA;
  }

  async summarize(
    text: string,
    options?: SummarizerOptions
  ): Promise<SummaryResult> {
    // Allow options to override the base URL
    const baseUrl = options?.ollamaConfig?.baseUrl || this.baseUrl;
    const timeout = options?.ollamaConfig?.timeout || this.timeout;

    // Get model from options or use default
    const model = options?.model || DEFAULT_MODEL;

    // Truncate text if too long
    let truncatedText = text;
    const maxLength = options?.maxLength || DEFAULT_MAX_LENGTH;
    if (text.length > maxLength) {
      truncatedText = text.substring(0, maxLength);
    }

    const systemPrompt =
      'You are a snarky assistant that summarizes web page content.';
    const userPrompt =
      'Please summarize this web page content:\n\n' + truncatedText;

    // Build the prompt - Ollama uses a specific format
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: fullPrompt,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();

        // Check for common Ollama errors
        if (response.status === 404) {
          throw new SummarizationError(
            `Model '${model}' not found. Run 'ollama list' to see available models.`
          );
        }

        if (response.status === 0 || response.status === 500) {
          throw new SummarizationError(
            `Cannot connect to Ollama at ${baseUrl}. Is Ollama running?`
          );
        }

        throw new SummarizationError(
          `Ollama API error: ${response.status} - ${errorText}`
        );
      }

      const data = (await response.json()) as {
        response?: string;
        error?: string;
      };

      // Handle Ollama error response
      if (data.error) {
        throw new SummarizationError(`Ollama error: ${data.error}`);
      }

      const summary = data.response || 'No summary generated';

      return {
        summary,
        model,
        tokensUsed: 0, // Ollama doesn't provide token usage
      };
    } catch (error) {
      if (error instanceof SummarizationError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new SummarizationError(
            `Request to Ollama timed out after ${timeout}ms`
          );
        }

        // Connection errors
        if (
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('fetch failed') ||
          error.message.includes('NetworkError')
        ) {
          throw new SummarizationError(
            `Cannot connect to Ollama at ${baseUrl}. Is Ollama running?`
          );
        }

        throw new SummarizationError(
          `Ollama summarization failed: ${error.message}`,
          error
        );
      }

      throw new SummarizationError(
        'Ollama summarization failed: Unknown error'
      );
    }
  }
}
