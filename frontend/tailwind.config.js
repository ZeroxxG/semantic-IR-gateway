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
        sir: {
          dark: '#0a0d14',
          card: '#121722',
          cardHover: '#181f2e',
          border: '#1e293b',
          borderLight: '#334155',
          accent: '#38bdf8',
          accentGlow: 'rgba(56, 189, 248, 0.15)',
          emerald: '#10b981',
          emeraldGlow: 'rgba(16, 185, 129, 0.15)',
          purple: '#a855f7',
          amber: '#f59e0b',
        }
      },
      fontFamily: {
        mono: ['Fira Code', 'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
