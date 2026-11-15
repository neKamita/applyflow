import type { ReactNode } from 'react'

export interface EmptyStateProps {
  title: ReactNode
  body?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-2 py-10">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {body && <p className="max-w-prose text-base text-ink-muted">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
