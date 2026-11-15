import type { StampShape as Shape } from './status'

// Notched rectangle: a rectangle with its four corners cut, like an exit stamp.
function notched(w: number, h: number, inset: number, cut: number): string {
  const [l, t, r, b] = [inset, inset, w - inset, h - inset]
  return [
    [l + cut, t],
    [r - cut, t],
    [r, t + cut],
    [r, b - cut],
    [r - cut, b],
    [l + cut, b],
    [l, b - cut],
    [l, t + cut],
  ]
    .map(([x, y]) => `${String(x)},${String(y)}`)
    .join(' ')
}

/** Outline of a stamp, drawn in currentColor. Used full size by Stamp and as an icon by StatusBadge. */
export function StampShape({ shape, className }: { shape: Shape; className?: string }) {
  if (shape === 'circle') {
    return (
      <svg viewBox="0 0 100 100" aria-hidden className={className} fill="none" stroke="currentColor">
        <circle cx="50" cy="50" r="46" strokeWidth="3" strokeDasharray="7 5" />
        <circle cx="50" cy="50" r="39" strokeWidth="1" />
      </svg>
    )
  }
  if (shape === 'rect') {
    return (
      <svg
        viewBox="0 0 160 100"
        preserveAspectRatio="none"
        aria-hidden
        className={className}
        fill="none"
        stroke="currentColor"
      >
        <rect x="3" y="3" width="154" height="94" rx="6" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        <rect
          x="10"
          y="10"
          width="140"
          height="80"
          rx="3"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    )
  }
  return (
    <svg
      viewBox="0 0 160 100"
      preserveAspectRatio="none"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
    >
      <polygon
        points={notched(160, 100, 3, 14)}
        strokeWidth="3"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <polygon
        points={notched(160, 100, 10, 10)}
        strokeWidth="1"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
