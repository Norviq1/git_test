import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { TopNav } from '@/ui/TopNav'
import { SearchPalette } from '@/ui/SearchPalette'
import { LoadingVeil } from '@/ui/LoadingVeil'
import { Fallback } from '@/ui/Fallback'
import { useStore } from '@/store/useStore'
import Home from '@/pages/Home'
import Explorer from '@/pages/Explorer'
import Encyclopedia from '@/pages/Encyclopedia'
import BodyPage from '@/pages/BodyPage'
import Compare from '@/pages/Compare'
import Missions from '@/pages/Missions'
import Science from '@/pages/Science'

const Scene = lazy(() => import('@/three/Scene'))

export default function App() {
  const webglOk = useStore((s) => s.webglOk)
  const setSearchOpen = useStore((s) => s.setSearchOpen)
  const { pathname } = useLocation()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setSearchOpen])

  return (
    <>
      {webglOk ? (
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      ) : (
        <Fallback />
      )}
      <LoadingVeil />
      <TopNav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explorer />} />
        <Route path="/explore/:id" element={<Explorer />} />
        <Route path="/encyclopedia" element={<Encyclopedia />} />
        <Route path="/encyclopedia/:id" element={<BodyPage />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/missions" element={<Missions />} />
        <Route path="/science" element={<Science />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <SearchPalette key={pathname} />
    </>
  )
}
