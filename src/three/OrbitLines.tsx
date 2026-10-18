import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { Group } from 'three'
import { BODY_MAP, HELIO_BODIES, MOONS } from '@/data/bodies'
import type { Body } from '@/data/types'
import { sampleOrbitAU } from '@/lib/orbit'
import { moonDistanceScale, scaleVector } from '@/lib/scale'
import { positions } from '@/store/sim'
import { useStore } from '@/store/useStore'

function HelioOrbit({ body }: { body: Body }) {
  const mode = useStore((s) => s.scaleMode)
  const selected = useStore((s) => s.selectedId === body.id || s.hoveredId === body.id)
  const points = useMemo(
    () => sampleOrbitAU(body.orbit!, 360).map((p) => {
      scaleVector(p, mode)
      return [p.x, p.y, p.z] as [number, number, number]
    }),
    [body.orbit, mode],
  )
  const dwarf = body.kind === 'dwarf'
  return (
    <Line
      points={points}
      color={selected ? body.accent : dwarf ? '#7d8aa0' : '#5f87a8'}
      lineWidth={selected ? 1.6 : 1}
      transparent
      opacity={selected ? 0.95 : dwarf ? 0.28 : 0.42}
      dashed={dwarf}
      dashSize={mode === 'true' ? 120 : 1.6}
      gapSize={mode === 'true' ? 80 : 1.1}
      depthWrite={false}
      raycast={() => null}
    />
  )
}

function MoonOrbit({ moon }: { moon: Body }) {
  const mode = useStore((s) => s.scaleMode)
  const near = useStore((s) => {
    const f = s.focusId
    return f === moon.parent || f === moon.id || s.selectedId === moon.id
  })
  const group = useRef<Group>(null!)
  const parent = BODY_MAP[moon.parent!]
  const points = useMemo(() => {
    const r = moonDistanceScale(moon, parent, mode)
    const pts: [number, number, number][] = []
    for (let k = 0; k <= 128; k++) {
      const a = (k / 128) * Math.PI * 2
      pts.push([Math.cos(a) * r, 0, -Math.sin(a) * r])
    }
    return pts
  }, [moon, parent, mode])
  useFrame(() => group.current.position.copy(positions[parent.id]))
  return (
    <group ref={group}>
      <group rotation={[0, 0, (parent.axialTilt * Math.PI) / 180]}>
        <Line points={points} color={near ? '#9fdcff' : '#4a6a86'} lineWidth={1} transparent opacity={near ? 0.55 : 0.18} depthWrite={false} raycast={() => null} />
      </group>
    </group>
  )
}

export function OrbitLines() {
  const show = useStore((s) => s.showOrbits)
  if (!show) return null
  return (
    <>
      {HELIO_BODIES.map((b) => (
        <HelioOrbit key={b.id} body={b} />
      ))}
      {MOONS.map((m) => (
        <MoonOrbit key={m.id} moon={m} />
      ))}
    </>
  )
}
