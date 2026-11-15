import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'

export interface ErrorStateProps {
  title: ReactNode
  body?: ReactNode
  onRetry?: () => void
  retryLabel?: ReactNode
}

export function ErrorState({ title, body, onRetry, retryLabel }: ErrorStateProps) {
  return (
    <div role="alert" className="flex items-start gap-3 py-6">
      <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-stamp-failed" />
      <div className="flex flex-col items-start gap-2">
        <p className="text-base font-semibold text-ink">{title}</p>
        {body && <p className="max-w-prose text-base text-ink-muted">{body}</p>}
        {onRetry && retryLabel && (
          <Button variant="secondary" size="sm" onClick={onRetry} className="mt-1">
            {retryLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
