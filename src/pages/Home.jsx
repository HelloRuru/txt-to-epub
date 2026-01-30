import { Link } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../contexts/ThemeContext'

const tools = [
  {
    id: 'epub',
    name: 'TXT 轉 EPUB',
    description: '上傳 TXT 小說檔案，自動偵測章節結構、支援簡轉繁，一鍵生成標準 EPUB 電子書格式。',
    path: '/epub',
    ready: true,
    color: 'rose',
  },
  {
    id: 'epub-convert',
    name: 'EPUB 簡轉繁',
    description: '將簡體中文 EPUB 電子書轉換為繁體中文，保留原有格式與排版。',
    path: '/epub-convert',
    ready: true,
    color: 'lavender',
  },
  {
    id: 'image',
    name: '圖片工具',
    description: '壓縮、轉檔、調整尺寸，滿足日常圖片處理需求。',
    path: '/image',
    ready: false,
    color: 'sage',
  },
]

// SVG Icons
const BookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    <path d="M8 7h8"/>
    <path d="M8 11h6"/>
  </svg>
)

const ConvertIcon = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M12 3v18"/>
    <path d="M5 8l7-5 7 5"/>
    <path d="M8 14l4 4 4-4"/>
    <circle cx="5" cy="12" r="2"/>
    <circle cx="19" cy="12" r="2"/>
  </svg>
)

const ImageIcon = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)

const WrenchIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="white">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
)

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)

const LabIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M9 3h6v5l4 9a2 2 0 0 1-1.8 2.9H6.8A2 2 0 0 1 5 17l4-9V3z"/>
    <path d="M9 3h6"/>
    <path d="M7 15h10"/>
  </svg>
)

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
    <path d="M2 12h20"/>
  </svg>
)

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
  </svg>
)

const getIcon = (id) => {
  switch (id) {
    case 'epub': return <BookIcon />
    case 'epub-convert': return <ConvertIcon />
    case 'image': return <ImageIcon />
    default: return <BookIcon />
  }
}

export default function Home() {
  const { isDark } = useTheme()
  
  // 年份自動計算
  const startYear = 2026
  const currentYear = new Date().getFullYear()
  const yearDisplay = currentYear > startYear ? `${startYear}–${currentYear}` : `${startYear}`

  return (
    <div 
      className="min-h-screen py-12 px-6 transition-colors duration-500 relative"
      style={{ 
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <a href="https://lab.helloruru.com" className="flex items-center gap-4 group">
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:rotate-[-15deg] group-hover:scale-110"
              style={{ 
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                boxShadow: '0 4px 20px rgba(212, 165, 165, 0.3)'
              }}
            >
              <WrenchIcon />
            </div>
            <div>
              <div className="font-serif text-3xl font-semibold tracking-wide">Tools</div>
              <div 
                className="text-xs font-medium tracking-widest uppercase mt-0.5"
                style={{ color: 'var(--accent-primary)' }}
              >
                HelloRuru
              </div>
            </div>
          </a>
          <ThemeToggle />
        </header>

        {/* Hero */}
        <section className="text-center mb-14">
          <h1 className="font-serif text-5xl md:text-6xl font-semibold tracking-wide mb-5">
            <span 
              className="text-gradient"
              style={{ 
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 50%, var(--accent-tertiary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Tools
            </span>
          </h1>
          <p 
            className="font-serif text-base leading-relaxed tracking-wide mb-5"
            style={{ color: 'var(--text-secondary)' }}
          >
            簡單好用的線上小工具。<br/>全程本機處理，保護你的隱私。
          </p>
          <span 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm"
            style={{ 
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              boxShadow: 'var(--shadow)'
            }}
          >
            <ShieldIcon style={{ color: 'var(--accent-primary)' }} />
            檔案不會上傳到任何伺服器
          </span>
        </section>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {tools.map((tool, index) => (
            tool.ready ? (
              <Link
                key={tool.id}
                to={tool.path}
                className="group relative flex flex-col p-8 rounded-3xl transition-all duration-500 overflow-hidden animate-fadeInUp"
                style={{ 
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow)',
                  animationDelay: `${index * 0.1}s`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-hover)'
                  e.currentTarget.querySelector('.top-bar').style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'var(--shadow)'
                  e.currentTarget.querySelector('.top-bar').style.opacity = '0'
                }}
              >
                {/* Top gradient bar */}
                <div 
                  className="top-bar absolute top-0 left-0 right-0 h-1 rounded-t-3xl transition-opacity duration-300"
                  style={{ 
                    background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                    opacity: 0
                  }}
                />
                
                {/* Icon */}
                <div 
                  className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-5deg] icon-container ${tool.color}`}
                  style={{ 
                    color: tool.color === 'rose' ? 'var(--rose)' : 
                           tool.color === 'lavender' ? 'var(--lavender)' : 'var(--sage)'
                  }}
                >
                  {getIcon(tool.id)}
                </div>
                
                {/* Content */}
                <h3 className="font-serif text-xl font-semibold mb-3 tracking-wide">{tool.name}</h3>
                <p 
                  className="font-serif text-sm leading-relaxed flex-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {tool.description}
                </p>
                
                {/* Arrow */}
                <div 
                  className="absolute bottom-7 right-7 w-10 h-10 rounded-full flex items-center justify-center opacity-0 -translate-x-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-x-0"
                  style={{ 
                    background: 'var(--bg-secondary)',
                    color: 'var(--accent-primary)'
                  }}
                >
                  <ArrowIcon />
                </div>
              </Link>
            ) : (
              <div
                key={tool.id}
                className="relative flex flex-col p-8 rounded-3xl opacity-60 animate-fadeInUp"
                style={{ 
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  animationDelay: `${index * 0.1}s`
                }}
              >
                {/* Icon */}
                <div 
                  className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 icon-container ${tool.color}`}
                  style={{ 
                    color: tool.color === 'sage' ? 'var(--sage)' : 'var(--accent-primary)'
                  }}
                >
                  {getIcon(tool.id)}
                </div>
                
                {/* Content */}
                <h3 className="font-serif text-xl font-semibold mb-3 tracking-wide">{tool.name}</h3>
                <p 
                  className="font-serif text-sm leading-relaxed flex-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {tool.description}
                </p>
                
                {/* Coming soon badge */}
                <span 
                  className="inline-flex items-center gap-1.5 mt-4 text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <ClockIcon />
                  即將推出
                </span>
              </div>
            )
          ))}
        </div>

        {/* Footer */}
        <footer 
          className="mt-10 pt-12 text-center"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <p 
            className="font-serif text-sm flex items-center justify-center gap-2 mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ShieldIcon style={{ color: 'var(--accent-primary)' }} />
            所有檔案處理皆在瀏覽器本機完成
          </p>
          <p 
            className="font-serif text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            © {yearDisplay} Kaoru Tsai. All Rights Reserved. |{' '}
            <a 
              href="mailto:hello@helloruru.com"
              className="transition-colors hover:opacity-80"
              style={{ color: 'var(--accent-primary)' }}
            >
              hello@helloruru.com
            </a>
          </p>
          <div className="flex justify-center gap-8 mt-5">
            <a 
              href="https://lab.helloruru.com" 
              className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              <LabIcon />
              Lab
            </a>
            <a 
              href="https://helloruru.com" 
              className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              <GlobeIcon />
              HelloRuru
            </a>
            <a 
              href="https://github.com/HelloRuru" 
              className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              <GitHubIcon />
              GitHub
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
