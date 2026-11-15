import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { statusTone, type ApplicationStatus } from './status'
import { StampShape } from './StampShape'

export interface StampProps {
  status: ApplicationStatus
  title: string
  /** Second line, for example the formatted payment date. */
  date?: ReactNode
  /** Third line in small type, for example the program code. */
  code?: string
  /** Play the press-in when the stamp first lands. Off for stamps already present on load. */
  animate?: boolean
}

/**
 * The signature mark: application status as a passport stamp. Shape and ink both encode the
 * status. Decorative text is real text so it is read by screen readers and translated.
 */
export function Stamp({ status, title, date, code, animate = false }: StampProps) {
  const tone = statusTone[status]
  const round = tone.shape === 'circle'

  return (
    <div
      role="img"
      aria-label={[title, typeof date === 'string' ? date : null, code].filter(Boolean).join(', ')}
      className={clsx(
        'relative inline-grid place-items-center font-mono uppercase',
        tone.text,
        round ? 'size-40' : 'min-h-28 min-w-44 px-7 py-5',
        !round && (status === 'PAID' ? '-rotate-3' : 'rotate-2'),
        animate && 'animate-stamp motion-reduce:animate-none',
      )}
    >
      <StampShape shape={tone.shape} className="absolute inset-0 size-full" />
      <div
        aria-hidden
        className={clsx(
          'relative flex flex-col items-center gap-0.5 text-center',
          round ? 'max-w-28' : 'whitespace-nowrap',
        )}
      >
        <span
          className={clsx('leading-tight font-normal tracking-[0.08em]', round ? 'text-xs' : 'text-base')}
        >
          {title}
        </span>
        {date && <span className="text-xs tracking-[0.06em]">{date}</span>}
        {code && <span className="text-[0.6875rem] tracking-[0.08em] opacity-80">{code}</span>}
      </div>
    </div>
  )
}
