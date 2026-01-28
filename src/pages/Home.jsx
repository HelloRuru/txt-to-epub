import { Link } from 'react-router-dom'

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
    id: 'image',
    name: '圖片工具',
    description: '壓縮、轉檔、調整尺寸',
    icon: '🖼️',
    path: '/image',
    ready: false,
  },
  {
    id: 'pdf',
    name: 'PDF 工具',
    description: '合併、分割、壓縮',
    icon: '📄',
    path: '/pdf',
    ready: false,
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1612] to-[#2a2420] py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 標題 */}
        <header className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl text-cream mb-4">
            Ruru 工具箱
          </h1>
          <p className="text-warm-400 text-lg">
            簡單好用的線上小工具，全程本機處理，保護你的隱私
          </p>
        </header>

        {/* 工具卡片 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <div key={tool.id} className="relative">
              {tool.ready ? (
                <Link
                  to={tool.path}
                  className="block p-6 rounded-2xl bg-[#2a2420] border border-warm-700/30 
                           hover:border-warm-500/50 hover:bg-[#332c26] 
                           transition-all duration-300 group"
                >
                  <div className="text-4xl mb-4">{tool.icon}</div>
                  <h2 className="font-serif text-xl text-cream mb-2 group-hover:text-warm-400 transition-colors">
                    {tool.name}
                  </h2>
                  <p className="text-warm-400/80 text-sm leading-relaxed">
                    {tool.description}
                  </p>
                </Link>
              ) : (
                <div className="p-6 rounded-2xl bg-[#2a2420]/50 border border-warm-700/20 opacity-60">
                  <div className="text-4xl mb-4 grayscale">{tool.icon}</div>
                  <h2 className="font-serif text-xl text-cream/60 mb-2">
                    {tool.name}
                  </h2>
                  <p className="text-warm-400/50 text-sm leading-relaxed">
                    {tool.description}
                  </p>
                  <span className="absolute top-4 right-4 text-xs text-warm-500/50 bg-warm-700/20 px-2 py-1 rounded">
                    即將推出
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 底部說明 */}
        <footer className="mt-16 text-center text-warm-400/60 text-sm">
          <p>所有檔案處理皆在瀏覽器本機完成，不會上傳到任何伺服器</p>
        </footer>
      </div>
    </div>
  )
}
