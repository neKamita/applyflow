import { clsx } from 'clsx'
import type { HTMLAttributes } from 'react'

/** A page of the passport: one bordered surface. Panels are never nested. */
export function Panel({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('rounded-panel border border-line bg-panel', className)} {...rest} />
}
