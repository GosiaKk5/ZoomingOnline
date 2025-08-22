import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [sveltekit()],

  server: {
    port: 5173,
    host: true,
    cors: true,
    // Ensure proper MIME types for zarr files
    fs: {
      allow: [".."],
    },
  },

  preview: {
    port: 4173,
    host: true,
    cors: true,
    // Configure headers for static files including zarr
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, HEAD, OPTIONS",
      "Access-Control-Allow-Headers":
        "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control",
    },
  },
});
