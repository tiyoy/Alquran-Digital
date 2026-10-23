/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        emerald: { 50: '#ecfdf5', 100: '#d1fae5', 600: '#059669', 700: '#047857', 800: '#065f46', 950: '#022c22' },
        gold: { 50: '#fffbeb', 100: '#fef3c7', 500: '#d97706', 600: '#b45309' }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        quran: ['Amiri Quran', 'Scheherazade New', 'Noto Naskh Arabic', 'Amiri', 'Traditional Arabic', 'serif']
      },
      boxShadow: {
        soft: '0 12px 34px rgba(15, 61, 47, 0.08)',
        glow: '0 12px 32px rgba(5, 150, 105, 0.2)'
      }
    }
  },
  plugins: []
};
