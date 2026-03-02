import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sena: {
          green: '#39A900',
          dark: '#2E8700',
          light: '#5BD116'
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'system-ui',
          'sans-serif'
        ]
      },
      boxShadow: {
        card: '0 10px 40px -15px rgba(0,0,0,0.3)'
      }
    }
  },
  plugins: []
} satisfies Config;
