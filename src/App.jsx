import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import routes from './routes'

/**
 * App 根元件
 * 負責載入路由設定，不包含具體頁面邏輯
 */
function App() {
  return (
    <MainLayout>
      <Routes>
        {routes.map(({ path, element: Element }) => (
          <Route 
            key={path} 
            path={path} 
            element={<Element />} 
          />
        ))}
      </Routes>
    </MainLayout>
  )
}

export default App
