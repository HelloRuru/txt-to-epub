import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React 核心
            if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/')) {
              return 'vendor-react'
            }
            // 簡繁轉換（較大）
            if (id.includes('opencc')) {
              return 'vendor-opencc'
            }
            // EPUB 打包
            if (id.includes('jszip') || id.includes('file-saver') || id.includes('pako')) {
              return 'vendor-jszip'
            }
            // 字型處理
            if (id.includes('fonteditor')) {
              return 'vendor-font'
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
