import {
  Color, LinearFilter, LinearMipmapLinearFilter, Mesh, NoColorSpace, OrthographicCamera, PlaneGeometry, RepeatWrapping,
  ClampToEdgeWrapping, Scene, ShaderMaterial, SRGBColorSpace, Texture, WebGLRenderTarget, WebGLRenderer,
} from 'three'
import { BAKE_FRAG, BAKE_VERT, SURFACE_KINDS } from './shaders/surface'
import type { RenderRecipe } from './recipes'

const cache = new Map<string, { map: Texture; bump: Texture | null }>()

let quad: Mesh<PlaneGeometry, ShaderMaterial> | null = null
const scene = new Scene()
const cam = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

function getQuad() {
  if (!quad) {
    const mat = new ShaderMaterial({
      vertexShader: BAKE_VERT,
      fragmentShader: BAKE_FRAG,
      uniforms: {
        uKind: { value: 0 }, uOut: { value: 0 }, uSeed: { value: 0 },
        uC1: { value: new Color() }, uC2: { value: new Color() }, uC3: { value: new Color() }, uC4: { value: new Color() },
        uP: { value: [0, 0, 0, 0] },
      },
      depthTest: false,
      depthWrite: false,
    })
    quad = new Mesh(new PlaneGeometry(2, 2), mat)
    quad.frustumCulled = false
    scene.add(quad)
  }
  return quad
}

function renderPass(gl: WebGLRenderer, w: number, h: number, out: 0 | 1) {
  const target = new WebGLRenderTarget(w, h, {
    generateMipmaps: true,
    minFilter: LinearMipmapLinearFilter,
    magFilter: LinearFilter,
    depthBuffer: false,
    colorSpace: out === 0 ? SRGBColorSpace : NoColorSpace,
  })
  const q = getQuad()
  q.material.uniforms.uOut.value = out
  const prev = gl.getRenderTarget()
  const prevXr = gl.xr.enabled
  gl.xr.enabled = false
  gl.setRenderTarget(target)
  gl.render(scene, cam)
  gl.setRenderTarget(prev)
  gl.xr.enabled = prevXr
  const tex = target.texture
  tex.wrapS = RepeatWrapping
  tex.wrapT = ClampToEdgeWrapping
  tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
  return tex
}

/**
 * Bake a procedural, equirectangular surface map (and optional height map)
 * on the GPU. Results are cached per body and resolution.
 */
export function bakeSurface(gl: WebGLRenderer, id: string, recipe: NonNullable<RenderRecipe['surface']>, width: number) {
  const key = `${id}:${width}`
  const hit = cache.get(key)
  if (hit) return hit
  const q = getQuad()
  const u = q.material.uniforms
  u.uKind.value = SURFACE_KINDS[recipe.kind]
  u.uSeed.value = recipe.seed ?? 0
  // colours are specified in sRGB; the shader converts to linear itself
  ;(['uC1', 'uC2', 'uC3', 'uC4'] as const).forEach((k, i) => (u[k].value as Color).setStyle(recipe.colors[i], NoColorSpace))
  u.uP.value = recipe.params ?? [0, 0, 0, 0]
  const h = width / 2
  const map = renderPass(gl, width, h, 0)
  const bump = recipe.bump ? renderPass(gl, width, h, 1) : null
  const result = { map, bump }
  cache.set(key, result)
  return result
}
