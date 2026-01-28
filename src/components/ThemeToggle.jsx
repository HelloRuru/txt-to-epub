import { useTheme } from '../contexts/ThemeContext'

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative w-14 h-7 rounded-full transition-all duration-300 btn-press
        ${isDark 
          ? 'bg-nadeshiko-700' 
          : 'bg-nadeshiko-300'
        }
      `}
      title={isDark ? '切換淺色模式' : '切換深色模式'}
    >
      {/* 滑塊 */}
      <span
        className={`
          absolute top-1 w-5 h-5 rounded-full transition-all duration-300
          flex items-center justify-center text-xs
          ${isDark 
            ? 'left-8 bg-nadeshiko-900' 
            : 'left-1 bg-white shadow-sm'
          }
        `}
      >
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  )
}
