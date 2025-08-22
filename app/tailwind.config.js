/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,js,svelte,ts}",
    "./src/app.html",
    "!./src/**/*.{test,spec}.{js,ts}"
  ],
  theme: {
    extend: {
      // Using default Tailwind colors instead of custom ones
      // primary → blue-600, secondary → gray-500, success → emerald-500
    },
  },
  plugins: [require("@tailwindcss/forms")],
  // Enable purging for production builds
  safelist: [
    // Preserve dynamic classes that might not be detected
    'btn-primary',
    'btn-secondary', 
    'btn-success',
    'btn-close',
    'btn-sm',
    'form-control',
    'form-select',
    'zoom-btn',
    'zoom-btn-in',
    'zoom-btn-out',
    'modal-backdrop',
    'modal-content',
    'modal-header',
    'modal-title',
    'modal-body',
    'zoom-rect',
    'zoom-rect-hit-area'
  ]
};
