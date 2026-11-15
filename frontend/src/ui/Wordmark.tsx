// Rosette mark: eight ellipses turned around a centre, the emblem printed on passport covers.
const petals = Array.from({ length: 8 }, (_, index) => index * 22.5)

export function Wordmark({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 32 32" aria-hidden className="size-7" fill="none" stroke="currentColor">
        {petals.map((angle) => (
          <ellipse
            key={angle}
            cx="16"
            cy="16"
            rx="13"
            ry="5.5"
            strokeWidth="1"
            transform={`rotate(${String(angle)} 16 16)`}
          />
        ))}
        <circle cx="16" cy="16" r="2.5" fill="currentColor" stroke="none" />
      </svg>
      <span className="text-lg font-semibold tracking-[-0.01em]">{label}</span>
    </span>
  )
}
