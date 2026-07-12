/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F5F4F0',
        surface: '#FFFFFF',
        ink: {
          900: '#14181F',
          700: '#2B313C',
          500: '#626B79',
          300: '#9AA1AC',
        },
        line: '#E3E1DA',
        pine: {
          DEFAULT: '#1F5C4E',
          dark: '#153F35',
          soft: '#E7EFEC',
        },
        amber: {
          DEFAULT: '#C97A2C',
          soft: '#FBEEE0',
        },
        rust: {
          DEFAULT: '#B5433A',
          soft: '#F8E9E7',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,24,31,0.04), 0 1px 0 rgba(20,24,31,0.04)',
      },
    },
  },
  plugins: [],
}
