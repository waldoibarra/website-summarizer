/**
 * Options for the website summarizer CLI
 */
export interface SummarizerOptions {
  /** The URL to summarize */
  url: string;
  /** The AI model to use (default: google/gemini-2.0-flash-001) */
  model?: string;
  /** Maximum characters to send to AI (default: 8000) */
  maxLength?: number;
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

