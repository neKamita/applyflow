import type { InputHTMLAttributes, ReactNode, Ref } from 'react'
import { useId } from 'react'
import { Field } from './Field'
import { controlClass, describedBy } from './field-parts'

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
  ref?: Ref<HTMLInputElement>
}

export function TextField({ label, hint, error, className, ref, ...rest }: TextFieldProps) {
  const id = useId()
  const parts = { id, hintId: `${id}-hint`, errorId: `${id}-error` }

  return (
    <Field parts={parts} label={label} hint={hint} error={error}>
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(parts, hint, error)}
        className={[controlClass, className].filter(Boolean).join(' ')}
        {...rest}
      />
    </Field>
  )
}
