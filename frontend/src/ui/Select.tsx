import { ChevronDown } from 'lucide-react'
import type { ReactNode, Ref, SelectHTMLAttributes } from 'react'
import { useId } from 'react'
import { Field } from './Field'
import { controlClass, describedBy } from './field-parts'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'children'> {
  label: ReactNode
  options: readonly SelectOption[]
  hint?: ReactNode
  error?: ReactNode
  ref?: Ref<HTMLSelectElement>
}

/** Native select: the most accessible control for short lists, and the best one on phones. */
export function Select({ label, options, hint, error, ref, ...rest }: SelectProps) {
  const id = useId()
  const parts = { id, hintId: `${id}-hint`, errorId: `${id}-error` }

  return (
    <Field parts={parts} label={label} hint={hint} error={error}>
      <div className="relative">
        <select
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(parts, hint, error)}
          className={`${controlClass} appearance-none pr-10`}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted"
        />
      </div>
    </Field>
  )
}
