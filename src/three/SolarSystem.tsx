import { Suspense } from 'react'
import { BODIES } from '@/data/bodies'
import { Body } from './Body'
import { Sun } from './Sun'
import { Belts } from './Belt'
import { OrbitLines } from './OrbitLines'
import { Sky } from './Sky'
import { SystemClock } from './SystemClock'
import { CameraRig } from './CameraRig'
import { LabelUpdater } from './Labels'

export function SolarSystem() {
  return (
    <>
      <SystemClock />
      <CameraRig />
      <Sky />
      <ambientLight intensity={0.035} color="#9fb4ff" />
      <Sun />
      {BODIES.filter((b) => b.kind !== 'star').map((b) => (
        <Suspense key={b.id} fallback={null}>
          <Body body={b} />
        </Suspense>
      ))}
      <Belts />
      <OrbitLines />
      <LabelUpdater />
    </>
  )
}
