/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-dark': '#1a1a2e',
        'bg-card': '#16213e',
        'accent-gold': '#ffd700',
        'accent-green': '#4caf50',
        'accent-red': '#f44336',
        'text-light': '#ffffff',
        'text-muted': '#b0b0b0',
      },
      fontSize: {
        'display': ['4.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-sm': ['3rem', { lineHeight: '1.2', fontWeight: '700' }],
        'title': ['2rem', { lineHeight: '1.3', fontWeight: '600' }],
        'subtitle': ['1.5rem', { lineHeight: '1.4', fontWeight: '500' }],
        'body': ['1.25rem', { lineHeight: '1.5' }],
        'body-sm': ['1.125rem', { lineHeight: '1.5' }],
      },
    },
  },
  plugins: [],
};
