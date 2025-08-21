/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,js,svelte,ts}",
    "./src/app.html",
    "!./src/**/*.{test,spec}.{js,ts}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#007bff",
          hover: "#0056b3",
        },
        secondary: {
          DEFAULT: "#6c757d",
          hover: "#5a6268",
        },
        success: {
          DEFAULT: "#10b981",
          hover: "#059669",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
  // Enable purging for production builds
  safelist: [
    // Preserve dynamic classes that might not be detected
    'btn-primary',
    'btn-secondary', 
    'btn-success',
    'btn-link',
    'btn-close',
    'btn-sm',
    'form-control',
    'form-select',
    'card',
    'card-header',
    'card-body'
  ]
};
