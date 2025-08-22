import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

// SvelteKit configuration for SPA mode
const config = {
  preprocess: vitePreprocess(),

  // Enable Svelte 5 runes mode
  compilerOptions: {
    runes: true,
  },

  kit: {
    adapter: adapter({
      pages: "dist",
      assets: "dist",
      fallback: "index.html", // Enable SPA mode for client-side routing
      precompress: false,
      strict: true,
    }),

    // Disable prerendering for SPA mode
    prerender: {
      entries: [],
    },
  },
};

export default config;
