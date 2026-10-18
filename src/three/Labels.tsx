import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Vector3 } from 'three'
import { BODIES, BODY_MAP } from '@/data/bodies'
import { visVivaKms } from '@/lib/orbit'
import { fmt } from '@/lib/format'
import { helioAU, positions, sceneRadius } from '@/store/sim'
import { useStore } from '@/store/useStore'
import { moonDistanceScale } from '@/lib/scale'

/** DOM label elements, registered by <LabelLayer/> and positioned from the render loop. */
export const labelEls: Record<string, { root: HTMLElement; detail: HTMLElement } | undefined> = {}

const v = new Vector3()
const pv = new Vector3()
let tick = 0

/** True when a moon sits behind its parent's disk as seen from the camera. */
function occluded(parentId: string, x: number, y: number, dist: number, cam: PerspectiveCamera, size: { width: number; height: number }, tanHalf: number) {
  const pp = positions[parentId]
  const pd = cam.position.distanceTo(pp)
  if (dist <= pd) return false
  pv.copy(pp).project(cam)
  const px = ((pv.x + 1) / 2) * size.width
  const py = ((1 - pv.y) / 2) * size.height
  const pr = ((sceneRadius[parentId] ?? 0) / Math.max(pd * tanHalf, 1e-9)) * (size.height / 2)
  return Math.hypot(x - px, y - py) < pr
}

export function LabelUpdater() {
  useFrame(({ camera, size }) => {
    const st = useStore.getState()
    const cam = camera as PerspectiveCamera
    const tanHalf = Math.tan((cam.fov * Math.PI) / 360)
    const updateText = tick++ % 12 === 0
    for (const b of BODIES) {
      const el = labelEls[b.id]
      if (!el) continue
      const p = positions[b.id]
      const dist = cam.position.distanceTo(p)
      let visible = st.showLabels || st.hoveredId === b.id
      if (b.kind === 'moon') {
        const parent = BODY_MAP[b.parent!]
        const sys = moonDistanceScale(b, parent, st.scaleMode)
        const pd = cam.position.distanceTo(positions[parent.id])
        visible &&= pd < sys * 9 || st.focusId === b.id || st.selectedId === b.id
      }
      v.copy(p).project(cam)
      if (v.z > 1 || v.z < -1) visible = false
      if (!visible) {
        if (el.root.dataset.v !== '0') {
          el.root.style.opacity = '0'
          el.root.dataset.v = '0'
        }
        continue
      }
      const x = ((v.x + 1) / 2) * size.width
      const y = ((1 - v.y) / 2) * size.height
      const rPx = ((sceneRadius[b.id] ?? 0) / Math.max(dist * tanHalf, 1e-9)) * (size.height / 2)
      if (b.parent && occluded(b.parent, x, y, dist, cam, size, tanHalf)) {
        el.root.style.opacity = '0'
        el.root.dataset.v = '0'
        continue
      }
      const off = Math.min(rPx, size.height) + 10
      el.root.style.transform = `translate3d(${x.toFixed(1)}px, ${(y + off).toFixed(1)}px, 0) translateX(-50%)`
      const active = st.selectedId === b.id || st.hoveredId === b.id
      el.root.dataset.active = active ? '1' : '0'
      el.root.style.opacity = rPx > size.height * 0.7 && !active ? '0' : '1'
      el.root.dataset.v = '1'
      if (updateText) {
        if (st.labelDetail && b.orbit) {
          const r = helioAU[b.id].length()
          el.detail.textContent = `${fmt(r, 2)} AU · ${fmt(visVivaKms(r, b.orbit.a), 1)} km/s`
        } else if (st.labelDetail && b.moonOrbit) {
          el.detail.textContent = `${fmt(b.moonOrbit.distanceKm)} km`
        } else if (st.labelDetail && b.kind === 'star') {
          el.detail.textContent = `${fmt(b.radiusKm * 2)} km wide`
        } else el.detail.textContent = ''
      }
    }
  })
  return null
}

