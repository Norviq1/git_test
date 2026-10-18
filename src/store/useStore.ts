import { create } from 'zustand'
import type { ScaleMode } from '@/lib/scale'
import { sim } from './sim'
import { dateToDays } from '@/lib/orbit'

export type Quality = 'high' | 'low'

interface State {
  scaleMode: ScaleMode
  showOrbits: boolean
  showLabels: boolean
  labelDetail: boolean
  showBelts: boolean
  quality: Quality
  /** body shown in the info panel */
  selectedId: string | null
  /** body the camera is travelling to / following; null = overview */
  focusId: string | null
  /** increments on every travel request so repeated requests re-trigger */
  travelNonce: number
  travelling: boolean
  hoveredId: string | null
  searchOpen: boolean
  inspectorOpen: boolean
  speed: number
  paused: boolean
  sceneReady: boolean
  webglOk: boolean
  /** cinematic overview pose + slow auto-rotation (home and reading pages) */
  cinematic: boolean
  /** horizontal pixels to shift the rendered view (keeps focused body clear of side panels) */
  viewShift: number

  travelTo: (id: string | null) => void
  select: (id: string | null) => void
  setHovered: (id: string | null) => void
  setScaleMode: (m: ScaleMode) => void
  toggle: (k: 'showOrbits' | 'showLabels' | 'labelDetail' | 'showBelts' | 'inspectorOpen') => void
  setQuality: (q: Quality) => void
  setSearchOpen: (v: boolean) => void
  setSpeed: (s: number) => void
  togglePause: () => void
  resetTime: () => void
  setTravelling: (v: boolean) => void
  setSceneReady: () => void
  setWebglOk: (v: boolean) => void
  setCinematic: (v: boolean) => void
  setViewShift: (px: number) => void
}

const prefersLow = typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches || (navigator.hardwareConcurrency ?? 8) <= 4)

export const useStore = create<State>((set, get) => ({
  scaleMode: 'explore',
  showOrbits: true,
  showLabels: true,
  labelDetail: false,
  showBelts: true,
  quality: prefersLow ? 'low' : 'high',
  selectedId: null,
  focusId: null,
  travelNonce: 0,
  travelling: false,
  hoveredId: null,
  searchOpen: false,
  inspectorOpen: false,
  speed: sim.speed,
  paused: sim.paused,
  sceneReady: false,
  webglOk: true,
  cinematic: false,
  viewShift: 0,

  travelTo: (id) => set((s) => ({ focusId: id, selectedId: id, travelNonce: s.travelNonce + 1 })),
  select: (id) => set({ selectedId: id }),
  setHovered: (id) => (get().hoveredId === id ? undefined : set({ hoveredId: id })),
  setScaleMode: (m) => set((s) => ({ scaleMode: m, travelNonce: s.travelNonce + 1 })),
  toggle: (k) => set((s) => ({ [k]: !s[k] }) as Partial<State>),
  setQuality: (q) => set({ quality: q }),
  setSearchOpen: (v) => set({ searchOpen: v }),
  setSpeed: (speed) => {
    sim.speed = speed
    set({ speed })
  },
  togglePause: () => {
    sim.paused = !sim.paused
    set({ paused: sim.paused })
  },
  resetTime: () => {
    sim.days = dateToDays(new Date())
  },
  setTravelling: (v) => (get().travelling === v ? undefined : set({ travelling: v })),
  setSceneReady: () => set({ sceneReady: true }),
  setWebglOk: (v) => set({ webglOk: v }),
  setCinematic: (v) => (get().cinematic === v ? undefined : set((s) => ({ cinematic: v, travelNonce: s.travelNonce + 1 }))),
  setViewShift: (px) => (get().viewShift === px ? undefined : set({ viewShift: px })),
}))
