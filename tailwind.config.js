/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        mono: ['"DM Mono"', 'monospace'],
        sans: ['Inter', '"DM Sans"', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          bg: 'rgb(var(--brand-bg) / <alpha-value>)',
          surface: 'rgb(var(--brand-surface) / <alpha-value>)',
          elevated: 'rgb(var(--brand-elevated) / <alpha-value>)',
          border: 'rgb(var(--brand-border) / <alpha-value>)',
          borderHi: 'rgb(var(--brand-border-hi) / <alpha-value>)',
          textPri: 'rgb(var(--brand-text-pri) / <alpha-value>)',
          textSec: 'rgb(var(--brand-text-sec) / <alpha-value>)',
          textTer: 'rgb(var(--brand-text-ter) / <alpha-value>)',
          accent: 'rgb(var(--brand-accent) / <alpha-value>)',
          accentHover: 'rgb(var(--brand-accent-hover) / <alpha-value>)',
          accentSoft: 'rgb(var(--brand-accent-soft) / <alpha-value>)',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
        'nav': '0 1px 0 rgba(0,0,0,0.06)',
        'dropdown': '0 8px 32px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
