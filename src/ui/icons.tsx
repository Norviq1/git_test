import type { SVGProps } from 'react'

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, ...p,
})

export const IconSearch = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>)
export const IconPlay = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M7 5.5v13l11-6.5z" fill="currentColor" stroke="none" /></svg>)
export const IconPause = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M8 5v14M16 5v14" strokeWidth={2.4} /></svg>)
export const IconReverse = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M11 6 5 12l6 6M19 6l-6 6 6 6" /></svg>)
export const IconHome = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><circle cx="12" cy="12" r="3" /><ellipse cx="12" cy="12" rx="10" ry="4" /></svg>)
export const IconClose = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>)
export const IconChevron = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="m9 6 6 6-6 6" /></svg>)
export const IconLayers = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="m12 4 9 5-9 5-9-5z" /><path d="m3 14 9 5 9-5" /></svg>)
export const IconRocket = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M5 19c1-3 2.5-4.5 4-5M14.5 4.5C18 4 20 6 19.5 9.5L13 16l-5-5z" /><circle cx="15" cy="9" r="1.4" /><path d="m8 11-3 .5L7 9M13 16l-.5 3L15 17" /></svg>)
export const IconOrbit = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><ellipse cx="12" cy="12" rx="9.5" ry="5.5" /><circle cx="12" cy="12" r="1.8" fill="currentColor" /><circle cx="20" cy="10" r="1.2" fill="currentColor" /></svg>)
export const IconInfo = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>)
export const IconSpark = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></svg>)
export const IconExpand = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" /></svg>)
export const IconMenu = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>)
