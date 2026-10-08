/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          DEFAULT: '#AFB596',
          light: '#C7CBB4',
          dark: '#9CA283',
        },
        cream: '#DBDCC9',
        mustard: '#E0C53D',
        forest: {
          DEFAULT: '#3D4836',
          dark: '#2C342A',
        },
        terracotta: '#D9714B',
        ink: '#1B1E16',
        muted: '#6E7460',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        block: '14px',
      },
      keyframes: {
        'card-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        'card-in': 'card-in 200ms ease-out',
      },
    },
  },
  plugins: [],
}
