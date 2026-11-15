import { clsx } from 'clsx'
import { statusTone, type ApplicationStatus } from './status'
import { StampShape } from './StampShape'

export interface StatusBadgeProps {
  status: ApplicationStatus
  label: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const tone = statusTone[status]
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-control px-2 py-0.5 text-sm font-medium',
        tone.text,
        tone.soft,
      )}
    >
      <StampShape shape={tone.shape} className={tone.shape === 'circle' ? 'size-3.5' : 'h-3 w-4'} />
      {label}
    </span>
  )
}
