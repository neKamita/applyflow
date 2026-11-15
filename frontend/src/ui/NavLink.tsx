import { clsx } from 'clsx'
import type { AnchorHTMLAttributes } from 'react'

export interface NavLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  current?: boolean
}

/** Header navigation link on the cover. Router integration wraps this in Phase 3. */
export function NavLink({ current = false, className, children, ...rest }: NavLinkProps) {
  return (
    <a
      aria-current={current ? 'page' : undefined}
      className={clsx(
        'inline-flex min-h-11 items-center rounded-control px-3 text-base text-on-cover-muted no-underline',
        'hover:bg-cover-raised hover:text-on-cover aria-[current=page]:text-on-cover',
        'aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8',
        className,
      )}
      {...rest}
    >
      {children}
    </a>
  )
}
