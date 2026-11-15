import { clsx } from 'clsx'
import { LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes, MouseEvent, Ref } from 'react'

import { buttonClass, type ButtonSize as Size, type ButtonVariant as Variant } from './button-styles'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /** Keeps the button focusable and announced as busy, but ignores activation. */
  loading?: boolean
  ref?: Ref<HTMLButtonElement>
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className,
  children,
  onClick,
  ref,
  ...rest
}: ButtonProps) {
  const inactive = disabled || loading

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (inactive) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  return (
    <button
      ref={ref}
      type={type}
      // aria-disabled instead of disabled keeps the button in the tab order, so focus does not
      // jump away while a submission is in flight.
      aria-disabled={inactive || undefined}
      aria-busy={loading || undefined}
      onClick={handleClick}
      className={clsx(buttonClass(variant, size), className)}
      {...rest}
    >
      {loading && <LoaderCircle aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />}
      {children}
    </button>
  )
}
