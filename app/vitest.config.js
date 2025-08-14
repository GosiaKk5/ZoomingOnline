import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // Only include files matching our unit test pattern
    include: ['src/**/*.test.js', 'src/**/*.spec.js'],
    // Explicitly exclude Playwright tests
    exclude: ['tests/**/*', 'node_modules/**/*', 'dist/**/*']
  }
});
