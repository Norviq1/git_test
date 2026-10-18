import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { PerspectiveCamera, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { getBody } from '@/data/bodies'
import { RECIPES } from './recipes'
import { ringOuter } from './Rings'
import { positions, sceneRadius } from '@/store/sim'
import { useStore } from '@/store/useStore'

const UP = new Vector3(0, 1, 0)
const OVERVIEW = {
  explore: new Vector3(-70, 150, 300),
  true: new Vector3(-9000, 14000, 34000),
}
const CINEMATIC = {
  explore: new Vector3(46, 9, 118),
  true: new Vector3(800, 160, 2400),
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

interface Travel {
  active: boolean
  t: number
  dur: number
  id: string | null
  fromTarget: Vector3
  fromDir: Vector3
  fromDist: number
  endDir: Vector3
  endDist: number
  length: number
}

let aspectBoost = 1

/** Distance at which a body fills a comfortable part of the view. */
function viewDistance(id: string) {
  return baseViewDistance(id) * aspectBoost
}

function baseViewDistance(id: string) {
  const r = sceneRadius[id] ?? 1
  const body = getBody(id)!
  const rings = RECIPES[id]?.rings
  const extent = rings === 'saturn' ? ringOuter('saturn') * 0.95 : 1
  if (body.kind === 'star') return r * 3.6
  return r * extent * 3.4
}

/** Pleasant approach direction: show the sunlit side with a hint of terminator. */
function approachDir(p: Vector3, out: Vector3) {
  if (p.lengthSq() < 1e-9) return out.set(0.35, 0.28, 1).normalize()
  const toSun = p.clone().negate().normalize()
  const side = new Vector3().crossVectors(UP, toSun).normalize()
  return out.copy(toSun).multiplyScalar(0.62).addScaledVector(side, 0.72).addScaledVector(UP, 0.3).normalize()
}

export function CameraRig() {
  const controls = useRef<OrbitControlsImpl>(null!)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  const focusId = useStore((s) => s.focusId)
  const nonce = useStore((s) => s.travelNonce)
  const mode = useStore((s) => s.scaleMode)
  const cinematic = useStore((s) => s.cinematic)
  const setTravelling = useStore((s) => s.setTravelling)
  const shift = useRef(0)
  const shiftY = useRef(0)
  const lastProj = useRef({ near: 0, shift: 0, sy: 0, w: 0, h: 0 })

  const travel = useRef<Travel>({
    active: false, t: 0, dur: 2, id: null,
    fromTarget: new Vector3(), fromDir: new Vector3(), fromDist: 1, endDir: new Vector3(), endDist: 1, length: 0,
  })
  const lastP = useRef(new Vector3())
  const first = useRef(true)

  // start a journey whenever the destination, scale mode or cinematic state changes
  useEffect(() => {
    const c = controls.current
    if (!c) return
    const tr = travel.current
    const dest = focusId ? positions[focusId] : new Vector3()
    tr.id = focusId
    tr.fromTarget.copy(c.target)
    const off = camera.position.clone().sub(c.target)
    tr.fromDist = Math.max(off.length(), 1e-6)
    tr.fromDir.copy(off).normalize()
    if (focusId) {
      tr.endDist = viewDistance(focusId)
      const near = tr.fromTarget.distanceTo(dest) < tr.endDist * 0.5
      if (near) tr.endDir.copy(tr.fromDir)
      else approachDir(dest, tr.endDir)
      if (focusId === 'sun') tr.endDir.copy(tr.fromDir).setY(Math.max(tr.fromDir.y, 0.25)).normalize()
    } else {
      const pose = (cinematic ? CINEMATIC : OVERVIEW)[mode]
      tr.endDist = pose.length()
      tr.endDir.copy(pose).normalize()
    }
    tr.length = tr.fromTarget.distanceTo(dest)
    tr.dur = Math.min(5, Math.max(1.5, 1.5 + 0.5 * Math.log(1 + tr.length / Math.max(tr.endDist, tr.fromDist))))
    if (first.current) {
      // first frame: jump straight to the pose so the explorer is usable immediately
      first.current = false
      tr.dur = 0.001
    }
    tr.t = 0
    tr.active = true
    setTravelling(true)
  }, [focusId, nonce, mode, cinematic, camera, setTravelling])

  useFrame((_, rawDt) => {
    const c = controls.current
    if (!c) return
    const dt = Math.min(rawDt, 0.05)
    const tr = travel.current
    const P = tr.id ? positions[tr.id] : new Vector3()
    const st = useStore.getState()

    if (tr.active) {
      // use (lightly capped) real time so slow devices don't stretch the journey
      tr.t = Math.min(1, tr.t + Math.min(rawDt, 0.25) / tr.dur)
      const e = easeInOut(tr.t)
      const e2 = easeOut(Math.min(1, tr.t * 1.25))
      c.target.lerpVectors(tr.fromTarget, P, e2)
      const dir = tr.fromDir.clone().lerp(tr.endDir, e)
      if (dir.lengthSq() < 1e-6) dir.copy(tr.endDir)
      dir.normalize()
      // radii may change mid-flight (first frame, scale switch), so re-evaluate the goal distance live
      if (tr.id) tr.endDist = viewDistance(tr.id)
      const base = Math.exp(Math.log(tr.fromDist) + (Math.log(tr.endDist) - Math.log(tr.fromDist)) * e)
      const bump = tr.length * 0.42 * Math.pow(Math.sin(Math.PI * tr.t), 1.3)
      camera.position.copy(c.target).addScaledVector(dir, base + bump)
      camera.lookAt(c.target)
      c.enabled = false
      if (tr.t >= 1) {
        tr.active = false
        c.enabled = true
        lastP.current.copy(P)
        setTravelling(false)
      }
    } else if (tr.id) {
      // follow the moving body
      const delta = P.clone().sub(lastP.current)
      camera.position.add(delta)
      c.target.add(delta)
      lastP.current.copy(P)
    }

    // limits that suit the current focus and scale
    const r = tr.id ? sceneRadius[tr.id] ?? 1 : 1
    c.minDistance = tr.id ? r * 1.25 : mode === 'true' ? 20 : 12
    c.maxDistance = mode === 'true' ? 90000 : 1100
    c.enablePan = !tr.id
    c.autoRotate = st.cinematic && !tr.active
    c.autoRotateSpeed = tr.id ? 0.35 : 0.12

    // dynamic near plane so tiny bodies in true scale never clip
    const dist = camera.position.distanceTo(c.target)
    const surfaceGap = Math.max(dist - (tr.id ? r : 0), 1e-7)
    const near = Math.min(0.5, Math.max(1e-7, surfaceGap * 0.25))
    // narrow (portrait) screens need more distance to fit the same object
    aspectBoost = size.width / size.height < 1 ? Math.pow(size.height / size.width, 0.75) : 1
    // smoothly shift the view to keep the focused object clear of side panels / bottom sheets
    const wantY = size.width < 1024 && st.selectedId && !st.cinematic ? size.height * 0.2 : 0
    shift.current += (st.viewShift - shift.current) * Math.min(1, dt * 5)
    shiftY.current += (wantY - shiftY.current) * Math.min(1, dt * 5)
    const s = Math.abs(shift.current) < 0.5 ? 0 : Math.round(shift.current * 2) / 2
    const sy = Math.abs(shiftY.current) < 0.5 ? 0 : Math.round(shiftY.current * 2) / 2
    const lp = lastProj.current
    if (Math.abs(lp.near - near) / near > 0.05 || lp.shift !== s || lp.sy !== sy || lp.w !== size.width || lp.h !== size.height) {
      camera.near = near
      if (s !== 0 || sy !== 0) camera.setViewOffset(size.width, size.height, -s, sy, size.width, size.height)
      else if (camera.view) camera.clearViewOffset()
      camera.updateProjectionMatrix()
      lastProj.current = { near, shift: s, sy, w: size.width, h: size.height }
    }
  }, -2)

  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.075} rotateSpeed={0.55} zoomSpeed={0.9} panSpeed={0.6} />
}
