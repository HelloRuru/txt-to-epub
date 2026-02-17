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
        // 撫子色系 - 淺色模式
        nadeshiko: {
          50: '#FFFAF8',    // 主背景（微暖白）
          100: '#FFF5F5',   // 次背景
          200: '#FEDFE1',   // 桜 - 淺粉卡片
          300: '#F8C3CD',   // 淺撫子
          400: '#F596AA',   // 桃 - 按鈕色
          500: '#DC9FB4',   // 撫子 - 主色調
          600: '#B87D91',   // 深撫子
          700: '#8E5D6E',   // 更深
          800: '#64404D',   // 深色文字
          900: '#3D2830',   // 最深
        },
        // 深色模式用
        dark: {
          bg: '#1a1418',
          card: '#2a2025',
          border: '#3d2f35',
        }
      },
      fontFamily: {
        sans: ['GenSenRounded', '"Noto Sans TC"', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(220, 159, 180, 0.15)',
        'soft-lg': '0 8px 30px rgba(220, 159, 180, 0.2)',
      }
    },
  },
  plugins: [],
}
