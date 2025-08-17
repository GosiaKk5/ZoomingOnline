import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    // Only include files matching our unit test pattern (TypeScript)
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    // Explicitly exclude Playwright tests
    exclude: ["tests/**/*", "node_modules/**/*", "dist/**/*"],
  },
});
