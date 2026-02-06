import { lazy } from 'react'

// 懶載入頁面元件
const Home = lazy(() => import('./pages/Home'))
const EpubTool = lazy(() => import('./pages/EpubTool'))
const EpubConvert = lazy(() => import('./pages/EpubConvert'))
const BgRemoval = lazy(() => import('./pages/BgRemoval'))

/**
 * 路由設定
 * 新增頁面時只需在此處新增路由
 */
export const routes = [
  {
    path: '/',
    element: Home,
    title: '首頁',
  },
  {
    path: '/epub',
    element: EpubTool,
    title: 'TXT 轉 EPUB',
  },
  {
    path: '/epub-convert',
    element: EpubConvert,
    title: 'EPUB 簡轉繁',
  },
  {
    path: '/bg-removal',
    element: BgRemoval,
    title: '批次去背',
  },
]

export default routes
