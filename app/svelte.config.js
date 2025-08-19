import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

// Svelte 5 still supports preprocess configuration the same way
const config = {
  preprocess: vitePreprocess(),
};

export default config;
