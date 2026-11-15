import type { ReactNode } from 'react'
import type { FieldParts } from './field-parts'

interface FieldProps {
  parts: FieldParts
  label: ReactNode
  hint?: ReactNode | undefined
  error?: ReactNode | undefined
  children: ReactNode
}

/** Label, control, hint and error stacked with the ids the control references. */
export function Field({ parts, label, hint, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={parts.id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && (
        <p id={parts.hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={parts.errorId} className="text-sm font-medium text-stamp-failed">
          {error}
        </p>
      )}
    </div>
  )
}
