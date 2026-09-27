import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Only run files inside tests/ — never touch e2e/ (that's Playwright's domain)
    include: ['tests/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
    // Resolve the @/ path alias the same way Next.js/tsconfig does
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
    // Give integration tests (DB calls) extra time
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
