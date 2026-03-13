import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Prompt Extraction', () => {
  const summarizerPath = path.join(process.cwd(), 'src/summarizer.ts');
  
  it('should extract system prompt to a constant', () => {
    const content = fs.readFileSync(summarizerPath, 'utf-8');
    
    // Check that SYSTEM_PROMPT constant exists
    expect(content).toContain("const SYSTEM_PROMPT = 'You are a helpful assistant that summarizes web page content. Provide a concise summary of the following text.'");
  });

  it('should extract user prompt prefix to a constant', () => {
    const content = fs.readFileSync(summarizerPath, 'utf-8');
    
    // Check that USER_PROMPT_PREFIX constant exists
    expect(content).toContain("const USER_PROMPT_PREFIX = 'Please summarize this web page content:\\n\\n'");
  });

  it('should use SYSTEM_PROMPT constant in API call', () => {
    const content = fs.readFileSync(summarizerPath, 'utf-8');
    
    // Check that SYSTEM_PROMPT is used (not hardcoded)
    expect(content).toContain("role: 'system'");
    expect(content).toContain("content: SYSTEM_PROMPT");
  });

  it('should use USER_PROMPT_PREFIX constant in API call', () => {
    const content = fs.readFileSync(summarizerPath, 'utf-8');
    
    // Check that USER_PROMPT_PREFIX is used (not hardcoded)
    expect(content).toContain("USER_PROMPT_PREFIX");
    expect(content).toContain("content: USER_PROMPT_PREFIX");
  });

  it('should not have hardcoded system prompt in messages', () => {
    const content = fs.readFileSync(summarizerPath, 'utf-8');
    
    // After extraction, the hardcoded prompt should be replaced with the constant
    // This regex checks that the hardcoded string is NOT in the messages section
    const messagesSection = content.match(/messages:\s*\[[\s\S]*?\]/);
    if (messagesSection) {
      const systemMessageMatch = messagesSection[0].match(/role:\s*['"]system['"][\s\S]*?content:\s*['"]([^'"]+)['"]/);
      if (systemMessageMatch) {
        expect(systemMessageMatch[1]).toBe('SYSTEM_PROMPT');
      }
    }
  });

  it('should not have hardcoded user prompt prefix in messages', () => {
    const content = fs.readFileSync(summarizerPath, 'utf-8');
    
    // After extraction, the hardcoded prefix should be replaced with the constant
    // Check that the content template uses the constant
    expect(content).toContain("content: USER_PROMPT_PREFIX + truncatedText");
  });
});
