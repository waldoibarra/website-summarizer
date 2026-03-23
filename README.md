# Website Summarizer CLI

A command-line tool to summarize websites using AI via OpenRouter or Ollama.

## Features

- Fetches web pages using a headless browser (Playwright)
- Extracts clean content from HTML using intelligent selectors
- Generates concise summaries using AI models via OpenRouter or Ollama
- Supports multiple AI providers (OpenRouter, Ollama)
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
# Basic usage (uses OpenRouter by default)
website-summarizer <url>

# With custom model
website-summarizer <url> --model anthropic/claude-3-haiku

# With custom max length
website-summarizer <url> --max-length 5000

# Use Ollama provider (local)
website-summarizer <url> --provider ollama

# Use Ollama with custom model
website-summarizer <url> --provider ollama --model qwen3
```

### Options

| Option         | Alias | Description                            | Default           |
| -------------- | ----- | -------------------------------------- | ----------------- |
| `--model`      | `-m`  | AI model to use                        | `openrouter/free` |
| `--max-length` | `-l`  | Maximum characters to send to AI       | `8000`            |
| `--provider`   | `-p`  | AI provider (`openrouter` or `ollama`) | `openrouter`      |

## Environment Variables

Copy the example environment file and add your API key:

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your API key
```

### OpenRouter

Get a free API key from [OpenRouter](https://openrouter.ai/).

Required: `OPENROUTER_API_KEY`

### Ollama

Ollama runs locally. Install from [ollama.ai](https://ollama.ai) and ensure it's running.

Optional: `OLLAMA_BASE_URL` (default: `http://localhost:11434`)

The `.env` file is ignored by git — never commit secrets.

## Examples

```bash
# Summarize a news article (uses OpenRouter)
website-summarizer https://example.com/article

# Use a different model with OpenRouter
website-summarizer https://example.com --model anthropic/claude-3-sonnet

# Limit content length for faster processing
website-summarizer https://example.com --max-length 4000

# Use Ollama (local model)
website-summarizer https://example.com --provider ollama

# Use specific Ollama model
website-summarizer https://example.com --provider ollama --model llama3.2
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

The tool consists of several modules:

1. **Browser** (`src/browser.ts`) - Fetches web pages using Playwright
2. **Extractor** (`src/extractor.ts`) - Extracts clean content from HTML using Cheerio
3. **Providers** (`src/providers/`) - AI provider implementations
   - `base.ts` - Shared logic and base class
   - `openrouter.ts` - OpenRouter provider
   - `ollama.ts` - Ollama provider
   - `factory.ts` - Factory for creating providers
4. **CLI** (`src/index.ts`) - Command-line interface using Commander

### Error Handling

Custom error types provide specific error messages:

- `ValidationError` - Invalid URLs or input
- `BrowserError` - Page fetching failures
- `ExtractionError` - Content extraction issues
- `SummarizationError` - AI API errors

## License

ISC
