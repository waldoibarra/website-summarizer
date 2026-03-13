import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';

describe('Dotenv Configuration', () => {
  const originalEnv = process.env;
  const testEnvPath = path.join(process.cwd(), '.env.test');

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    // Create a test .env file
    fs.writeFileSync(testEnvPath, 'OPENROUTER_API_KEY=test-key-from-dotenv\n');
  });

  afterEach(() => {
    process.env = originalEnv;
    // Clean up test .env file
    if (fs.existsSync(testEnvPath)) {
      fs.unlinkSync(testEnvPath);
    }
  });

  it('should have dotenv imported in CLI (index.ts)', async () => {
    // Read index.ts to verify dotenv is imported
    const indexPath = path.join(process.cwd(), 'src/index.ts');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');

    // Check that dotenv/config is imported at the top of the file
    expect(indexContent).toMatch(/import\s+['"]dotenv\/config['"]/);
  });
});

