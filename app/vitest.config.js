import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    // Only exclude Playwright tests - other defaults are fine
    exclude: ["tests/**/*", "node_modules/**/*"],
  },
});
