import { useTheme } from '../contexts/ThemeContext'

const SunIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="5"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
)

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110"
      style={{ 
        background: 'var(--bg-card)',
        border: '2px solid var(--border)',
        boxShadow: 'var(--shadow)',
        color: 'var(--icon-stroke)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'rotate(180deg) scale(1.1)'
        e.currentTarget.style.borderColor = 'var(--accent-primary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'rotate(0deg) scale(1)'
        e.currentTarget.style.borderColor = 'var(--border)'
      }}
      title={isDark ? '切換淺色模式' : '切換深色模式'}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
