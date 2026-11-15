// A guilloche band: interlaced sine curves like the security print on a passport page.
// Pure geometry, computed once at module load, drawn with non-scaling strokes.

const WIDTH = 1200
const HEIGHT = 24
const CURVES = 9
const STEPS = 240

function curve(index: number): string {
  const phase = (index / CURVES) * Math.PI * 2
  const points: string[] = []
  for (let step = 0; step <= STEPS; step++) {
    const x = (step / STEPS) * WIDTH
    const t = (x / WIDTH) * Math.PI * 2
    const y =
      HEIGHT / 2 + Math.sin(t * 14 + phase) * (HEIGHT * 0.3) + Math.sin(t * 5 - phase * 2) * (HEIGHT * 0.12)
    points.push(`${x.toFixed(1)},${y.toFixed(2)}`)
  }
  return `M${points.join('L')}`
}

const paths = Array.from({ length: CURVES }, (_, index) => curve(index))

export function Guilloche({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
      preserveAspectRatio="none"
      className={className}
      fill="none"
      stroke="currentColor"
    >
      {paths.map((d) => (
        <path key={d} d={d} strokeWidth="0.75" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  )
}
