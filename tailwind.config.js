/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6A7861',
          50: '#f0f2ee',
          100: '#e1e5dd',
          200: '#c3ccbb',
          300: '#a5b299',
          400: '#879877',
          500: '#6A7861',
          600: '#5a6852',
          700: '#4a5844',
          800: '#3a4735',
          900: '#2b3527',
        },
      },
    },
  },
  plugins: [],
} 