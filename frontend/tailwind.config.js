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
        primary: {
          DEFAULT: '#cc785c',
          active: '#a9583e',
          disabled: '#e6dfd8',
        },
        ink: {
          DEFAULT: '#141413',
          strong: '#141413',
        },
        body: {
          DEFAULT: '#3d3d3a',
          strong: '#252523',
        },
        muted: {
          DEFAULT: '#6c6a64',
          soft: '#8e8b82',
        },
        hairline: {
          DEFAULT: '#e6dfd8',
          soft: '#ebe6df',
        },
        canvas: {
          DEFAULT: '#faf9f5',
        },
        surface: {
          soft: '#f5f0e8',
          card: '#efe9de',
          'cream-strong': '#e8e0d2',
          dark: '#181715',
          'dark-elevated': '#252320',
          'dark-soft': '#1f1e1b',
        },
        'on-primary': '#ffffff',
        'on-dark': {
          DEFAULT: '#faf9f5',
          soft: '#a09d96',
        },
        accent: {
          teal: '#5db8a6',
          amber: '#e8a55a',
        },
        semantic: {
          success: '#5db872',
          warning: '#d4a017',
          error: '#c64545',
        }
      },
      fontFamily: {
        serif: ['Copernicus', 'Tiempos Headline', 'Cormorant Garamond', 'EB Garamond', 'Georgia', 'serif'],
        sans: ['StyreneB', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'Menlo', 'Monaco', 'monospace'],
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        pill: '9999px',
      },
      boxShadow: {
        'claude-subtle': '0 1px 3px rgba(20,20,19,0.08)',
        'claude-card': '0 4px 20px -2px rgba(20,20,19,0.06)',
        'claude-dark': '0 8px 32px -4px rgba(0,0,0,0.3)',
      },
      spacing: {
        section: '96px',
      }
    },
  },
  plugins: [],
}
