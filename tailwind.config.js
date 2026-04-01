/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecf0ff',
          100: '#d6deff',
          200: '#b5c4ff',
          300: '#8ca0ff',
          400: '#6f84fb',
          500: '#4f6ef7',
          600: '#425dd1',
          700: '#3349a8',
          800: '#273a83',
          900: '#1b285b',
        },
        accent: {
          purple: '#a78bfa',
          teal: '#34d399',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        heading: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
