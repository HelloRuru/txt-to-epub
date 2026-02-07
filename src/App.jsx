import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import MainLayout from './layouts/MainLayout'
import routes from './routes'

// ─── SEO head 標籤管理 ──────────────────────────────────

function setMeta(name, content, attr = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function setJsonLd(data) {
  // 移除舊的
  document.querySelectorAll('script[data-seo="jsonld"]').forEach(el => el.remove())
  // 寫入新的
  const items = Array.isArray(data) ? data : [data]
  items.forEach(item => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-seo', 'jsonld')
    script.textContent = JSON.stringify(item)
    document.head.appendChild(script)
  })
}

function updateSeo(seo) {
  if (!seo) return

  document.title = seo.title

  // Meta
  setMeta('description', seo.description)
  if (seo.keywords) setMeta('keywords', seo.keywords)

  // Canonical
  if (seo.canonical) setLink('canonical', seo.canonical)

  // Open Graph
  setMeta('og:title', seo.title, 'property')
  setMeta('og:description', seo.description, 'property')
  setMeta('og:url', seo.canonical || '', 'property')
  setMeta('og:type', 'website', 'property')
  setMeta('og:site_name', 'HelloRuru Tools', 'property')
  setMeta('og:locale', 'zh_TW', 'property')

  // Twitter Card
  setMeta('twitter:card', 'summary')
  setMeta('twitter:title', seo.title)
  setMeta('twitter:description', seo.description)

  // JSON-LD
  if (seo.jsonLd) setJsonLd(seo.jsonLd)
}

// ─── App ─────────────────────────────────────────────────

function App() {
  const location = useLocation()

  useEffect(() => {
    const route = routes.find(r => r.path === location.pathname)
    if (route?.seo) {
      updateSeo(route.seo)
    } else {
      document.title = route && route.path !== '/'
        ? `${route.title} — Tools — HelloRuru`
        : 'Tools — HelloRuru'
    }
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
