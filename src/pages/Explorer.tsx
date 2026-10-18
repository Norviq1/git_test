import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BODY_MAP } from '@/data/bodies'
import { useStore } from '@/store/useStore'
import { LabelLayer } from '@/ui/explorer/LabelLayer'
import { TimeDock } from '@/ui/explorer/TimeDock'
import { ObjectRail } from '@/ui/explorer/ObjectRail'
import { ViewPanel } from '@/ui/explorer/ViewPanel'
import { InfoPanel } from '@/ui/explorer/InfoPanel'
import { OrbitInspector } from '@/ui/explorer/OrbitInspector'
import { TravelHud } from '@/ui/explorer/TravelHud'
import { FactToast } from '@/ui/explorer/FactToast'
import { TravelMenu } from '@/ui/explorer/TravelMenu'
import { IconHome } from '@/ui/icons'

function useIsDesktop() {
  const [d, setD] = useState(() => window.matchMedia('(min-width: 1024px)').matches)
  useEffect(() => {
    const m = window.matchMedia('(min-width: 1024px)')
    const on = () => setD(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return d
}

export default function Explorer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const focusId = useStore((s) => s.focusId)
  const selectedId = useStore((s) => s.selectedId)
  const scaleMode = useStore((s) => s.scaleMode)
  const travelTo = useStore((s) => s.travelTo)
  const select = useStore((s) => s.select)
  const setCinematic = useStore((s) => s.setCinematic)
  const setViewShift = useStore((s) => s.setViewShift)
  const desktop = useIsDesktop()

  useEffect(() => {
    setCinematic(false)
    document.title = 'Explorer — Heliora'
  }, [setCinematic])

  // URL → camera
  useEffect(() => {
    if (id && BODY_MAP[id] && id !== useStore.getState().focusId) travelTo(id)
  }, [id, travelTo])
  // camera → URL (clicks in the 3D scene)
  useEffect(() => {
    if (focusId && focusId !== id) navigate(`/explore/${focusId}`, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId])

  useEffect(() => {
    setViewShift(desktop && selectedId ? -200 : 0)
    return () => setViewShift(0)
  }, [desktop, selectedId, setViewShift])

  const pick = useCallback(
    (target: string) => {
      travelTo(target)
      navigate(`/explore/${target}`)
    },
    [navigate, travelTo],
  )
  const reset = () => {
    travelTo(null)
    select(null)
    navigate('/explore')
  }

  return (
    <>
      <LabelLayer />
      <TravelHud />
      {scaleMode === 'true' && (
        <div className="pointer-events-none fixed left-1/2 top-[124px] z-10 w-[min(92vw,520px)] -translate-x-1/2 text-center lg:top-[76px]">
          <p className="hud !text-flare-300/90">True scale · sizes & distances to one scale · planets are specks — use labels or search</p>
        </div>
      )}

      <div className="pointer-events-none fixed left-4 top-1/2 z-20 hidden -translate-y-1/2 lg:block">
        <ObjectRail onPick={pick} />
      </div>

      <div className="pointer-events-none fixed right-4 top-[72px] z-20 flex flex-col items-end gap-2 lg:right-auto lg:left-4 lg:flex-row">
        <button className="btn glass pointer-events-auto h-10" onClick={reset} title="Reset camera to the full Solar System">
          <IconHome /> <span className="hidden sm:inline">Overview</span>
        </button>
        <div className="flex flex-col items-end gap-2 lg:hidden">
          <ViewPanel placement="down" />
          <TravelMenu onPick={pick} placement="down" />
        </div>
      </div>

      <div className={`pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 px-4 pb-[max(env(safe-area-inset-bottom),12px)] ${selectedId ? 'max-lg:hidden lg:pr-[424px]' : ''}`}>
        <div className="flex flex-col items-start gap-2 lg:hidden">
          <FactToast />
          <OrbitInspector />
        </div>
        <div className="lg:hidden">
          <ObjectRail onPick={pick} />
        </div>
        <div className="flex items-end gap-2 lg:justify-center">
          <div className="hidden flex-col items-start gap-2 lg:absolute lg:bottom-4 lg:left-4 lg:flex">
            <FactToast />
            <OrbitInspector />
            <ViewPanel placement="up" />
          </div>
          <div className="min-w-0 flex-1 lg:flex-none"><TimeDock /></div>
          <div className={`hidden lg:absolute lg:bottom-4 lg:block ${selectedId ? 'lg:right-[424px]' : 'lg:right-4'}`}>
            <TravelMenu onPick={pick} placement="up" />
          </div>
        </div>
      </div>

      <InfoPanel onPick={pick} onClose={() => select(null)} />
    </>
  )
}
