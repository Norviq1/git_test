import { Component, type ReactNode, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei'
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { ACESFilmicToneMapping } from 'three'
import { SolarSystem } from './SolarSystem'
import { useStore } from '@/store/useStore'

function Effects() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.92} luminanceSmoothing={0.2} radius={0.72} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette eskil={false} offset={0.22} darkness={0.62} />
    </EffectComposer>
  )
}

function ReadySignal() {
  const frames = useRef(0)
  const setReady = useStore((s) => s.setSceneReady)
  useFrame(() => {
    if (++frames.current === 3) setReady()
  })
  return null
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err: unknown) {
    console.error('3D scene failed', err)
    useStore.getState().setWebglOk(false)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export function hasWebGL2() {
  try {
    const c = document.createElement('canvas')
    return !!c.getContext('webgl2')
  } catch {
    return false
  }
}

export default function Scene() {
  const quality = useStore((s) => s.quality)
  const setQuality = useStore((s) => s.setQuality)
  const setWebglOk = useStore((s) => s.setWebglOk)
  useEffect(() => {
    if (!hasWebGL2()) setWebglOk(false)
  }, [setWebglOk])
  const webglOk = useStore((s) => s.webglOk)
  if (!webglOk) return null
  const high = quality === 'high'
  return (
    <SceneBoundary>
      <Canvas
        className="!fixed inset-0"
        dpr={high ? [1, 1.75] : [1, 1.25]}
        gl={{ antialias: !high, logarithmicDepthBuffer: true, powerPreference: 'high-performance', alpha: false, stencil: false }}
        camera={{ fov: 45, near: 0.1, far: 200000, position: [-70, 150, 300] }}
        onCreated={({ gl }) => {
          gl.setClearColor('#010207')
          gl.toneMapping = ACESFilmicToneMapping
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault()
            setWebglOk(false)
          })
        }}
        raycaster={{ params: { Points: { threshold: 0 }, Line: { threshold: 0 }, Mesh: {}, LOD: {}, Sprite: {} } }}
      >
        <PerformanceMonitor onDecline={() => quality === 'high' && setQuality('low')} flipflops={2} />
        <AdaptiveDpr pixelated={false} />
        <SolarSystem />
        {high && <Effects />}
        <ReadySignal />
      </Canvas>
    </SceneBoundary>
  )
}
