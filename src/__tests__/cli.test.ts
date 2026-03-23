import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';

describe('CLI Entry Point', () => {
  beforeEach(() => {
    // Prevent process.exit from causing unhandled errors in tests
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  describe('CLI argument parsing', () => {
    it('should be able to import the CLI module', async () => {
      const { program } = await import('../index.js');
      expect(program).toBeDefined();
    });

    it('should export a Command instance', async () => {
      const { program } = await import('../index.js');
      expect(program).toBeInstanceOf(Command);
    });

    it('should have name set', async () => {
      const { program } = await import('../index.js');
      expect(program.name()).toBe('website-summarizer');
    });

    it('should have version set', async () => {
      const { program } = await import('../index.js');
      expect(program.version()).toBe('1.0.0');
    });

    it('should have model option', async () => {
      const { program } = await import('../index.js');
      const modelOption = program.options.find(
        (opt: any) => opt.long === '--model'
      );
      expect(modelOption).toBeDefined();
    });

    it('should have max-length option', async () => {
      const { program } = await import('../index.js');
      const maxLengthOption = program.options.find(
        (opt: any) => opt.long === '--max-length'
      );
      expect(maxLengthOption).toBeDefined();
    });
  });
});
