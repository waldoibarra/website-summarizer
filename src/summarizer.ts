import {
  createLLMProvider,
  type SummarizerOptions,
  type SummaryResult,
} from './providers/index.js';
import { ProviderType } from './types.js';

/**
 * Generate a summary for the given text using the default provider (OpenRouter)
 * @param text - The text content to summarize
 * @param options - Optional configuration
 * @returns SummaryResult with the summary and metadata
 * @throws SummarizationError if summarization fails
 * @deprecated Use createLLMProvider() and provider.summarize() for new code
 */
export async function summarize(
  text: string,
  options?: SummarizerOptions
): Promise<SummaryResult> {
  // Default to openrouter for backward compatibility
  const providerType = options?.provider || ProviderType.OPENROUTER;
  const provider = createLLMProvider(providerType);
  return provider.summarize(text, options);
}

export { ProviderType } from './types.js';
export type { SummarizerOptions, SummaryResult } from './types.js';
