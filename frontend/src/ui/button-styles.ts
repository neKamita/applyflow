import { clsx } from 'clsx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'md' | 'sm'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'border border-line-strong bg-panel text-ink hover:bg-sunken',
  ghost: 'text-ink hover:bg-sunken',
}

const sizes: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 text-base',
  sm: 'min-h-9 px-3 text-sm',
}

/** Shared by Button and links that look like buttons, so both stay identical. */
export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return clsx(
    'inline-flex items-center justify-center gap-2 rounded-control font-medium no-underline',
    'transition-colors duration-150 ease-out select-none',
    'aria-disabled:cursor-not-allowed aria-disabled:opacity-60',
    variants[variant],
    sizes[size],
  )
}
