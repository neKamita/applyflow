import type { ReactNode } from 'react'
import { Guilloche } from './Guilloche'

export interface PageShellProps {
  brand: ReactNode
  nav?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  skipLinkLabel: string
  children: ReactNode
}

/** The passport cover: header in cover ink with the guilloche band, then the page. */
export function PageShell({ brand, nav, actions, footer, skipLinkLabel, children }: PageShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-control bg-panel px-3 py-2 text-ink focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        {skipLinkLabel}
      </a>
      <header className="bg-cover text-on-cover">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <div className="shrink-0">{brand}</div>
          {nav && <div className="order-3 w-full sm:order-none sm:w-auto sm:flex-1">{nav}</div>}
          {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
        </div>
        <Guilloche className="block h-6 w-full text-guilloche" />
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none sm:px-6 sm:py-8"
      >
        {children}
      </main>
      {footer && (
        <footer className="border-t border-line">
          <div className="mx-auto w-full max-w-6xl px-4 py-5 text-sm text-ink-muted sm:px-6">{footer}</div>
        </footer>
      )}
    </div>
  )
}
