import { Link } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../contexts/ThemeContext'

const tools = [
  {
    id: 'epub',
    name: 'TXT 轉 EPUB',
    description: '上傳 TXT 小說，自動偵測章節、簡轉繁、生成 EPUB 電子書',
    icon: '📖',
    path: '/epub',
    ready: true,
  },
  {
    id: 'epub-convert',
    name: 'EPUB 簡轉繁',
    description: '將簡體 EPUB 電子書轉換為繁體中文',
    icon: '🔄',
    path: '/epub-convert',
    ready: false,
  },
  {
    id: 'image',
    name: '圖片工具',
    description: '壓縮、轉檔、調整尺寸',
    icon: '🖼️',
    path: '/image',
    ready: false,
  },
]

export default function Home() {
  const { isDark } = useTheme()

  return (
    <div className={`min-h-screen py-16 px-4 transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-b from-dark-bg to-dark-card' 
        : 'bg-gradient-to-b from-nadeshiko-50 to-nadeshiko-100'
    }`}>
      <div className="max-w-4xl mx-auto">
        {/* 頂部切換 */}
        <div className="flex justify-end mb-8">
          <ThemeToggle />
        </div>

        {/* 標題 */}
        <header className="text-center mb-16">
          <h1 className={`text-4xl md:text-5xl mb-4 ${
            isDark ? 'text-nadeshiko-200' : 'text-nadeshiko-700'
          }`}>
            ✿ HelloRuru-Tools ✿
          </h1>
          <div className="decorative-line mb-4"></div>
          <p className={`text-lg mb-3 ${isDark ? 'text-nadeshiko-400' : 'text-nadeshiko-500'}`}>
            簡單好用的線上小工具，全程本機處理，保護個人隱私。
          </p>
          <p className={`text-sm italic ${isDark ? 'text-nadeshiko-500' : 'text-nadeshiko-400'}`}>
            「一起在世界的難題裡面學著如何開心，慢慢前進。」
          </p>
        </header>

        {/* 工具卡片 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <div key={tool.id} className="relative">
              {tool.ready ? (
                <Link
                  to={tool.path}
                  className={`block p-6 rounded-2xl border transition-all duration-300 card-hover ${
                    isDark 
                      ? 'bg-dark-card border-dark-border hover:border-nadeshiko-600' 
                      : 'bg-white/80 border-nadeshiko-200 hover:border-nadeshiko-400 shadow-soft'
                  }`}
                >
                  <div className="text-4xl mb-4">{tool.icon}</div>
                  <h2 className={`text-xl mb-2 transition-colors ${
                    isDark 
                      ? 'text-nadeshiko-200 group-hover:text-nadeshiko-300' 
                      : 'text-nadeshiko-700'
                  }`}>
                    {tool.name}
                  </h2>
                  <p className={`text-sm leading-relaxed ${
                    isDark ? 'text-nadeshiko-400/80' : 'text-nadeshiko-500/80'
                  }`}>
                    {tool.description}
                  </p>
                </Link>
              ) : (
                <div className={`p-6 rounded-2xl border opacity-60 ${
                  isDark 
                    ? 'bg-dark-card/50 border-dark-border' 
                    : 'bg-white/40 border-nadeshiko-200/50'
                }`}>
                  <div className="text-4xl mb-4 grayscale">{tool.icon}</div>
                  <h2 className={`text-xl mb-2 ${
                    isDark ? 'text-nadeshiko-400' : 'text-nadeshiko-500'
                  }`}>
                    {tool.name}
                  </h2>
                  <p className={`text-sm leading-relaxed ${
                    isDark ? 'text-nadeshiko-600' : 'text-nadeshiko-400'
                  }`}>
                    {tool.description}
                  </p>
                  <span className={`absolute top-4 right-4 text-xs px-2 py-1 rounded ${
                    isDark 
                      ? 'text-nadeshiko-500 bg-dark-border' 
                      : 'text-nadeshiko-400 bg-nadeshiko-100'
                  }`}>
                    即將推出
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 底部說明 */}
        <footer className={`mt-16 text-center text-sm ${
          isDark ? 'text-nadeshiko-600' : 'text-nadeshiko-400'
        }`}>
          <p>所有檔案處理皆在瀏覽器本機完成，不會上傳到任何伺服器。</p>
          <p className="mt-3">Copyright © 2025 Kaoru Tsai. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
