import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Default Model Configuration', () => {
  it('should default to openrouter/free in CLI (index.ts)', async () => {
    const indexPath = path.join(process.cwd(), 'src/index.ts');
    const content = fs.readFileSync(indexPath, 'utf-8');
    
    // Check that CLI defaults to 'openrouter/free'
    expect(content).toContain("'openrouter/free'");
    expect(content).toContain("model <model>");
  });

  it('should default to openrouter/free in summarizer (summarizer.ts)', async () => {
    const summarizerPath = path.join(process.cwd(), 'src/summarizer.ts');
    const content = fs.readFileSync(summarizerPath, 'utf-8');
    
    // Check that DEFAULT_MODEL is set to 'openrouter/free'
    expect(content).toContain("DEFAULT_MODEL = 'openrouter/free'");
  });
});
