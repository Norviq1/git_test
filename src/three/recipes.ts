import type { SurfaceKind } from './shaders/surface'

/** Texture folder, relative to the app's base URL so the site also works from a sub-path. */
const T = `${import.meta.env.BASE_URL}textures/`

/** Visual-only configuration for each body. Not scientific data. */
export interface RenderRecipe {
  surface?: {
    kind: SurfaceKind
    colors: [string, string, string, string]
    params?: [number, number, number, number]
    seed?: number
    bump?: number
  }
  /** real texture maps (Earth, Moon) */
  textures?: { map: string; normal?: string; specular?: string; lights?: string; clouds?: string; bumpFromMap?: number }
  atmosphere?: { color: string; intensity: number; thickness: number }
  rings?: 'saturn' | 'uranus' | 'neptune' | 'jupiter'
  roughness?: number
  /** squash along the polar axis (true oblateness, e.g. Saturn 0.902) */
  oblateness?: number
  /** irregular shape distortion for small moons */
  lumpy?: number
}

export const RECIPES: Record<string, RenderRecipe> = {
  mercury: { surface: { kind: 'cratered', colors: ['#8c8580', '#b3aba2', '#d7d0c6', '#000000'], params: [4.2, 0.9, 0, 0], seed: 1.3, bump: 0.9 }, roughness: 0.95 },
  venus: { surface: { kind: 'venus', colors: ['#d9b77a', '#f1dfb3', '#b98b4e', '#000000'], seed: 2.1 }, atmosphere: { color: '#ffd9a0', intensity: 1.1, thickness: 0.05 }, roughness: 1 },
  earth: {
    textures: { map: T + 'earth_atmos_2048.jpg', normal: T + 'earth_normal_2048.jpg', specular: T + 'earth_specular_2048.jpg', lights: T + 'earth_lights_2048.png', clouds: T + 'earth_clouds_1024.png' },
    atmosphere: { color: '#5fb2ff', intensity: 1.35, thickness: 0.035 },
    roughness: 0.85,
  },
  moon: { textures: { map: T + 'moon_1024.jpg', bumpFromMap: 0.35 }, roughness: 1 },
  mars: { surface: { kind: 'mars', colors: ['#b5532c', '#d7804a', '#5f2f1d', '#f2ece4'], params: [0.945, 0, 0, 0], seed: 3.7, bump: 1.1 }, atmosphere: { color: '#ff9e72', intensity: 0.45, thickness: 0.025 }, roughness: 0.97 },
  phobos: { surface: { kind: 'cratered', colors: ['#5a514a', '#776c62', '#8c8277', '#000000'], params: [3.0, 0.4, 0, 0], seed: 5.2, bump: 1.4 }, lumpy: 0.22 },
  deimos: { surface: { kind: 'cratered', colors: ['#6e655b', '#8a8075', '#a0968a', '#000000'], params: [2.0, 0.3, 0, 0], seed: 6.4, bump: 0.8 }, lumpy: 0.16 },
  ceres: { surface: { kind: 'ceres', colors: ['#56524d', '#77726b', '#8a857c', '#f4f4f0'], params: [5.0, 0.5, 0, 0], seed: 7.7, bump: 1.0 } },
  jupiter: { surface: { kind: 'gas', colors: ['#b98c63', '#efe0c8', '#8d5a3b', '#7a6b60'], params: [1.0, 22.0, 1.0, 0], seed: 4.4 }, atmosphere: { color: '#f2d7b0', intensity: 0.5, thickness: 0.02 }, rings: 'jupiter', oblateness: 0.935, roughness: 1 },
  io: { surface: { kind: 'io', colors: ['#d9c35a', '#efe39a', '#b4672f', '#2a1d14'], seed: 8.1, bump: 0.6 } },
  europa: { surface: { kind: 'europa', colors: ['#e9e2d6', '#d1c3ad', '#9a5f3e', '#b98e6e'], seed: 9.3, bump: 0.4 }, roughness: 0.7 },
  ganymede: { surface: { kind: 'ganymede', colors: ['#5e554b', '#a39a8c', '#d9d2c6', '#cfd6dc'], seed: 10.2, bump: 0.8 } },
  callisto: { surface: { kind: 'cratered', colors: ['#3d3730', '#5d544a', '#cdc4b5', '#000000'], params: [5.5, 1.0, 0, 0], seed: 11.6, bump: 0.9 } },
  saturn: { surface: { kind: 'gas', colors: ['#d8bd8a', '#efe0bb', '#b89a6a', '#9aa7a6'], params: [0.45, 17.0, 0.0, 0], seed: 12.5 }, atmosphere: { color: '#f5e2b8', intensity: 0.45, thickness: 0.02 }, rings: 'saturn', oblateness: 0.902, roughness: 1 },
  titan: { surface: { kind: 'titan', colors: ['#d38e3e', '#e8a952', '#9a6a33', '#000000'], seed: 13.2 }, atmosphere: { color: '#ffb35a', intensity: 1.0, thickness: 0.08 }, roughness: 1 },
  enceladus: { surface: { kind: 'enceladus', colors: ['#f2f6f8', '#dfe8ee', '#7fb3d4', '#000000'], seed: 14.1, bump: 0.6 }, roughness: 0.55 },
  uranus: { surface: { kind: 'ice', colors: ['#a6dde3', '#c3ebee', '#8fcfd6', '#e6fbfc'], params: [0.35, 18.0, 0.15, 0], seed: 15.3 }, atmosphere: { color: '#b6f2f7', intensity: 0.7, thickness: 0.03 }, rings: 'uranus', oblateness: 0.977, roughness: 1 },
  titania: { surface: { kind: 'cratered', colors: ['#7f766c', '#a39a8f', '#d0c9be', '#000000'], params: [4.5, 0.7, 0, 0], seed: 16.2, bump: 0.8 } },
  neptune: { surface: { kind: 'ice', colors: ['#2f57c9', '#4b7be0', '#24409a', '#e3ecff'], params: [0.6, 14.0, 0.6, 0], seed: 17.9 }, atmosphere: { color: '#6f97ff', intensity: 0.8, thickness: 0.03 }, rings: 'neptune', oblateness: 0.983, roughness: 1 },
  triton: { surface: { kind: 'triton', colors: ['#c9bdb4', '#ddd3cc', '#efd9d2', '#6c5a52'], seed: 18.4, bump: 0.6 } },
  pluto: { surface: { kind: 'pluto', colors: ['#b89a7c', '#d9c3a8', '#5c3424', '#f3ebe2'], seed: 19.6, bump: 0.7 }, atmosphere: { color: '#9fc4ff', intensity: 0.35, thickness: 0.03 } },
}
