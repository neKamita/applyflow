import { clsx } from 'clsx'
import type { ReactNode } from 'react'

export type TimelineState = 'done' | 'pending' | 'failed'

export interface TimelineItem {
  id: string
  title: ReactNode
  meta?: ReactNode
  detail?: ReactNode
  state: TimelineState
}

const markers: Record<TimelineState, string> = {
  done: 'bg-stamp-paid border-stamp-paid',
  pending: 'border-stamp-submitted border-dashed bg-panel',
  failed: 'bg-stamp-failed border-stamp-failed',
}

export function Timeline({ items, label }: { items: readonly TimelineItem[]; label: string }) {
  return (
    <ol aria-label={label} className="flex flex-col">
      {items.map((item, index) => (
        <li key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
          {index < items.length - 1 && (
            <span aria-hidden className="absolute top-5 bottom-0 left-[0.4375rem] w-px bg-line" />
          )}
          <span
            aria-hidden
            className={clsx('mt-1 size-3.5 shrink-0 rounded-full border-2', markers[item.state])}
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-base font-medium text-ink">{item.title}</span>
            {item.meta && <span className="text-sm text-ink-muted">{item.meta}</span>}
            {item.detail && <span className="text-sm text-ink">{item.detail}</span>}
          </div>
        </li>
      ))}
    </ol>
  )
}
