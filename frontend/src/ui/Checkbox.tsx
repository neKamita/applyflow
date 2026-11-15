import type { InputHTMLAttributes, ReactNode } from 'react'
import { useId } from 'react'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> {
  label: ReactNode
}

export function Checkbox({ label, ...rest }: CheckboxProps) {
  const id = useId()
  return (
    <div className="flex min-h-11 items-center gap-2.5">
      <input id={id} type="checkbox" className="size-5 shrink-0 rounded-sm" {...rest} />
      <label htmlFor={id} className="text-base text-ink">
        {label}
      </label>
    </div>
  )
}
