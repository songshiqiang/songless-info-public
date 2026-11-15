import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The default 5 s is tight for the tests that walk the whole song library,
    // especially with several suites competing for the CPU on CI.
    testTimeout: 20_000,
    // Agent worktrees under .claude/ keep their own copy of every test file.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.astro/**', '.claude/**']
  }
});
