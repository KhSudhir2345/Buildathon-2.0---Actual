/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Charcoal palette for backgrounds and bento grids
        charcoal: {
          900: '#121212', // Main app background
          800: '#1a1a1a', // Bento card background
          700: '#262626', // Hover states and borders
          600: '#3f3f46', // Subtle dividers
        },
        // Forest Green palette for highlights (No neon allowed)
        forest: {
          900: '#064e3b', // Deep green buttons
          800: '#166534', // Hover states
          400: '#4ade80', // Subtle text highlights
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}