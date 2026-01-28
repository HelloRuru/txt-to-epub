/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FDF6E3',
        paper: '#FAF4E8',
        ink: '#3D3229',
        accent: '#8B4513',
        warm: {
          50: '#FFFBF5',
          100: '#FFF7EB',
          200: '#FFEFD6',
          300: '#FFE4BD',
          400: '#D4A574',
          500: '#8B4513',
          600: '#6B3410',
          700: '#4A240B',
        }
      },
      fontFamily: {
        serif: ['"Noto Serif TC"', 'serif'],
        sans: ['"Noto Sans TC"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
