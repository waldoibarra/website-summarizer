# Website Summarizer CLI

A command-line tool to summarize websites using AI via OpenRouter API.

## Features

- Fetches web pages using a headless browser (Playwright)
- Extracts clean content from HTML using intelligent selectors
- Generates concise summaries using AI models via OpenRouter
- Supports customizable AI models and content length limits
- Comprehensive error handling with user-friendly messages

## Installation

```bash
# Clone the repository
npm install

# Build the TypeScript
npm run build

# Install globally (optional)
npm link
```

## Usage

```bash
# Basic usage
website-summarizer <url>

# With custom model
website-summarizer <url> --model anthropic/claude-3-haiku

# With custom max length
website-summarizer <url> --max-length 5000
```

### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--model` | `-m` | AI model to use | `google/gemini-2.0-flash-001` |
| `--max-length` | `-l` | Maximum characters to send to AI | `8000` |

## Environment Variables

Set your OpenRouter API key:

```bash
export OPENROUTER_API_KEY=your_api_key_here
```

You can get a free API key from [OpenRouter](https://openrouter.ai/).

## Examples

```bash
# Summarize a news article
website-summarizer https://example.com/article

# Use a different model
website-summarizer https://example.com --model anthropic/claude-3-sonnet

# Limit content length for faster processing
website-summarizer https://example.com --max-length 4000
```

## Development

### Running Tests

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Mutation Testing

```bash
# Run mutation tests to validate test quality
npm run mutation
```

### Building

```bash
# Build TypeScript to JavaScript
npm run build
```

## Architecture

The tool consists of four main modules:

1. **Browser** (`src/browser.ts`) - Fetches web pages using Playwright
2. **Extractor** (`src/extractor.ts`) - Extracts clean content from HTML using Cheerio
3. **Summarizer** (`src/summarizer.ts`) - Generates summaries using OpenRouter API
4. **CLI** (`src/index.ts`) - Command-line interface using Commander

### Error Handling

Custom error types provide specific error messages:
- `ValidationError` - Invalid URLs or input
- `BrowserError` - Page fetching failures
- `ExtractionError` - Content extraction issues
- `SummarizationError` - AI API errors

## License

ISC
