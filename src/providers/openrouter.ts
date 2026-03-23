import { ProviderType } from '../types.js';
import { BaseLLMProvider } from './base.js';

const DEFAULT_MODEL = 'openrouter/free';

const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';

/**
 * OpenRouter provider implementation
 */
export class OpenRouterProvider extends BaseLLMProvider {
  getProviderType(): ProviderType {
    return ProviderType.OPENROUTER;
  }

  protected getBaseUrl(): string {
    return OPENROUTER_API_BASE;
  }

  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com',
      'X-Title': 'Website Summarizer',
    };
  }

  protected getApiKey(): string | undefined {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }
    return apiKey;
  }

  protected getDefaultModel(): string {
    return DEFAULT_MODEL;
  }
}
