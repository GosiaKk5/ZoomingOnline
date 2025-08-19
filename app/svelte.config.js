import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

// SvelteKit configuration for SPA mode
const config = {
  preprocess: vitePreprocess(),
  
  kit: {
    adapter: adapter({
      pages: 'dist',
      assets: 'dist',
      fallback: 'index.html', // Enable SPA mode for client-side routing
      precompress: false,
      strict: true
    }),
    
    // Configure base path for deployment
    paths: {
      base: '/ZoomingOnline'
    },
    
    // Disable prerendering for SPA mode
    prerender: {
      entries: []
    }
  }
};

export default config;
