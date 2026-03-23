import { ProviderType, type LLMProvider } from '../types.js';
import { SummarizationError } from '../errors.js';
import { OpenRouterProvider } from './openrouter.js';
import { OllamaProvider } from './ollama.js';

/**
 * Create an LLM provider instance based on the provider type
 * @param type - The provider type to create
 * @returns LLMProvider instance
 * @throws SummarizationError if type is invalid
 */
export function createLLMProvider(type?: ProviderType): LLMProvider {
  const providerType = type || ProviderType.OPENROUTER;

  switch (providerType) {
    case ProviderType.OPENROUTER:
      return new OpenRouterProvider();

    case ProviderType.OLLAMA:
      return new OllamaProvider();

    default:
      throw new SummarizationError(`Unsupported provider: ${type}`);
  }
}
