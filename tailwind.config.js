/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Inter Tight"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        void: '#03040a',
        ink: { 50: '#f4f7fb', 200: '#c9d3e0', 400: '#8a97ab', 500: '#667287', 700: '#2a3242', 800: '#161b26', 900: '#0b0e15' },
        cyan: { 300: '#8ae9ff', 400: '#4fd8ff', 500: '#1fbfeb' },
        flare: { 300: '#ffc488', 400: '#ffa552', 500: '#ff8a2a' },
      },
      letterSpacing: { hud: '0.18em' },
    },
  },
  plugins: [],
}
