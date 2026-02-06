import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import MainLayout from './layouts/MainLayout'
import routes from './routes'

function App() {
  const location = useLocation()

  useEffect(() => {
    const route = routes.find(r => r.path === location.pathname)
    document.title = route && route.path !== '/'
      ? `${route.title} — Tools — HelloRuru`
      : 'Tools — HelloRuru'
  }, [location.pathname])

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
