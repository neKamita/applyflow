import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useId } from 'react'

export interface RadioOption<V extends string> {
  value: V
  label: ReactNode
  description?: ReactNode
}

export interface RadioGroupProps<V extends string> {
  legend: ReactNode
  name: string
  options: readonly RadioOption<V>[]
  value: V | undefined
  onChange: (value: V) => void
  hint?: ReactNode
  error?: ReactNode
}

export function RadioGroup<V extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  hint,
  error,
}: RadioGroupProps<V>) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const described = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <fieldset aria-describedby={described} className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-medium text-ink">{legend}</legend>
      {options.map((option) => {
        const optionId = `${id}-${option.value}`
        const checked = option.value === value
        return (
          <label
            key={option.value}
            htmlFor={optionId}
            className={clsx(
              'flex cursor-pointer gap-3 rounded-control border px-3 py-2.5 transition-colors duration-150',
              checked ? 'border-primary bg-sunken' : 'border-line bg-panel hover:border-line-strong',
            )}
          >
            <input
              id={optionId}
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => {
                onChange(option.value)
              }}
              className="mt-0.5 size-5 shrink-0"
            />
            <span className="flex flex-col">
              <span className="text-base text-ink">{option.label}</span>
              {option.description && <span className="text-sm text-ink-muted">{option.description}</span>}
            </span>
          </label>
        )
      })}
      {hint && (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-stamp-failed">
          {error}
        </p>
      )}
    </fieldset>
  )
}
