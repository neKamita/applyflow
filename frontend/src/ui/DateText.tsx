import { formatDate } from './format'

export interface DateTextProps {
  value: string
  locale: string
  withTime?: boolean
}

export function DateText({ value, locale, withTime = false }: DateTextProps) {
  return (
    <time dateTime={value} className="tabular">
      {formatDate(value, locale, withTime)}
    </time>
  )
}
