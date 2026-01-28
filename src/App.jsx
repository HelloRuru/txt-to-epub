import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import EpubTool from './pages/EpubTool'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/epub" element={<EpubTool />} />
    </Routes>
  )
}

export default App
