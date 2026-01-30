import { Suspense } from 'react'
import { useTheme } from '../contexts/ThemeContext'

// Loading 元件
const LoadingSpinner = () => {
  const { isDark } = useTheme()
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="text-center">
        <div 
          className="w-12 h-12 rounded-full border-3 border-t-transparent animate-spin mx-auto mb-4"
          style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
        />
        <p 
          className="font-serif text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          載入中...
        </p>
      </div>
    </div>
  )
}

/**
 * 主版面配置
 * 提供 Suspense 包裝和共用樣式
 */
export default function MainLayout({ children }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  )
}
