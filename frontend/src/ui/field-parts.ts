import { clsx } from 'clsx'

export interface FieldParts {
  id: string
  hintId: string
  errorId: string
}

export function describedBy(parts: FieldParts, hint: unknown, error: unknown): string | undefined {
  const ids = [hint ? parts.hintId : null, error ? parts.errorId : null].filter(Boolean)
  return ids.length > 0 ? ids.join(' ') : undefined
}

export const controlClass = clsx(
  'min-h-11 w-full rounded-control border border-line-strong bg-panel px-3 text-base text-ink',
  'placeholder:text-ink-muted',
  'aria-invalid:border-stamp-failed aria-invalid:outline-stamp-failed',
  'disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-muted',
)
