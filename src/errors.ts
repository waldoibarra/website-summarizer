/**
 * Error thrown when URL validation fails
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Error.captureStackTrace(this, ValidationError);
  }
}

/**
 * Error thrown when browser operations fail
 */
export class BrowserError extends Error {
  public readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'BrowserError';
    this.cause = cause;
    Error.captureStackTrace(this, BrowserError);
  }
}

/**
 * Error thrown when content extraction fails
 */
export class ExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExtractionError';
    Error.captureStackTrace(this, ExtractionError);
  }
}

/**
 * Error thrown when AI summarization fails
 */
export class SummarizationError extends Error {
  public readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'SummarizationError';
    this.cause = cause;
    Error.captureStackTrace(this, SummarizationError);
  }
}
