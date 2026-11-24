/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: 'rgb(var(--primary-50) / <alpha-value>)',
          100: 'rgb(var(--primary-100) / <alpha-value>)',
          200: 'rgb(var(--primary-200) / <alpha-value>)',
          300: 'rgb(var(--primary-300) / <alpha-value>)',
          400: 'rgb(var(--primary-400) / <alpha-value>)',
          500: 'rgb(var(--primary-500) / <alpha-value>)',
          600: 'rgb(var(--primary-600) / <alpha-value>)',
          700: 'rgb(var(--primary-700) / <alpha-value>)',
          800: 'rgb(var(--primary-800) / <alpha-value>)',
          900: 'rgb(var(--primary-900) / <alpha-value>)',
          950: 'rgb(var(--primary-950) / <alpha-value>)',
        },
        teal: {
          700: 'rgb(var(--hero-end) / <alpha-value>)',
          950: 'rgb(var(--hero-end-dark) / <alpha-value>)',
        },
        gold: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          950: '#451A03',
        },
        canvas: 'rgb(var(--theme-canvas) / <alpha-value>)',
        'canvas-dark': 'rgb(var(--theme-canvas-dark) / <alpha-value>)',
        'surface-dark': 'rgb(var(--theme-surface-dark) / <alpha-value>)',
        'surface-modal': 'rgb(var(--theme-surface-modal) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        arabic: [
          'Amiri Quran',
          'Scheherazade New',
          'Noto Naskh Arabic',
          'Amiri',
          'Traditional Arabic',
          'serif',
        ],
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgb(var(--primary-600) / 0.12), 0 2px 6px -2px rgba(15, 23, 42, 0.05)',
        'soft-dark': '0 4px 24px -2px rgba(0, 0, 0, 0.5), 0 1px 4px rgb(var(--primary-500) / 0.1)',
      },
    },
  },
  plugins: [],
};
