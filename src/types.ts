/**
 * Provider type for AI summarization
 */
export enum ProviderType {
  OPENROUTER = 'openrouter',
  OLLAMA = 'ollama',
}

/**
 * Configuration for Ollama provider
 */
export interface OllamaConfig {
  /** Base URL for Ollama API (default: http://localhost:11434) */
  baseUrl?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
}
export interface SummarizerOptions {
  /** The URL to summarize */
  url: string;
  /** The AI model to use (default: google/gemini-2.0-flash-001) */
  model?: string;
  /** Maximum characters to send to AI (default: 8000) */
  maxLength?: number;
  /** The AI provider to use (default: openrouter) */
  provider?: ProviderType;
  /** Configuration for Ollama provider */
  ollamaConfig?: OllamaConfig;
}

/**
 * Content extracted from a webpage
 */
export interface ExtractedContent {
  /** The page title */
  title: string;
  /** The extracted text content */
  text: string;
  /** The original URL */
  url: string;
}

/**
 * Result from AI summarization
 */
export interface SummaryResult {
  /** The generated summary */
  summary: string;
  /** The model used */
  model: string;
  /** Number of tokens used */
  tokensUsed: number;
}

/**
 * Interface for LLM provider implementations
 */
export interface LLMProvider {
  /**
   * Generate a summary for the given text
   * @param text - The text content to summarize
   * @param options - Optional configuration
   * @returns SummaryResult with the summary and metadata
   */
  summarize(text: string, options?: SummarizerOptions): Promise<SummaryResult>;

  /**
   * Get the provider type
   */
  getProviderType(): ProviderType;
}
