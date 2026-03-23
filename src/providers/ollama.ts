import { ProviderType } from '../types.js';
import { BaseLLMProvider } from './base.js';

const DEFAULT_MODEL = 'qwen3';
const DEFAULT_OLLAMA_URL = 'http://localhost:11434';

/**
 * Ollama provider implementation using OpenAI-compatible /v1/chat/completions API
 */
export class OllamaProvider extends BaseLLMProvider {
  private baseUrl: string;

  constructor(options?: { baseUrl?: string }) {
    super();
    // Allow OLLAMA_BASE_URL env var or constructor option
    this.baseUrl =
      process.env.OLLAMA_BASE_URL || options?.baseUrl || DEFAULT_OLLAMA_URL;
  }

  getProviderType(): ProviderType {
    return ProviderType.OLLAMA;
  }

  protected getBaseUrl(): string {
    return this.baseUrl;
  }

  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  protected getApiKey(): string | undefined {
    // Ollama doesn't require an API key (local)
    return undefined;
  }

  protected getDefaultModel(): string {
    return DEFAULT_MODEL;
  }
}
