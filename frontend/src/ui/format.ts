// Formatting helpers shared by Money and DateText. Pure functions, so they are unit tested directly.

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

/** Formats an amount the backend sent as a decimal. The UI never does arithmetic on money. */
export function formatMoney(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    // Not narrowSymbol: that shows USD, CAD and AUD all as "$". 'symbol' gives "$", "CA$", "A$".
    currencyDisplay: 'symbol',
  }).format(amount)
}

/**
 * Parses an ISO instant or a date-only value ("2027-05-31"). Date-only values are anchored to UTC
 * midnight and formatted in UTC, so a deadline never shifts a day in western time zones.
 */
export function parseDate(value: string): { date: Date; dateOnly: boolean } {
  const match = DATE_ONLY.exec(value)
  if (match) {
    const [, y, m, d] = match
    return { date: new Date(Date.UTC(Number(y), Number(m) - 1, Number(d))), dateOnly: true }
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new RangeError(`Not a date: ${value}`)
  return { date, dateOnly: false }
}

export function formatDate(value: string, locale: string, withTime = false): string {
  const { date, dateOnly } = parseDate(value)
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    ...(withTime && !dateOnly ? { timeStyle: 'short' } : {}),
    ...(dateOnly ? { timeZone: 'UTC' } : {}),
  }).format(date)
}

/**
 * Whole calendar days from today to a date-only value; negative when past. "Today" is the UTC date,
 * because the backend accepts applications while `LocalDate.now(Clock.systemUTC())` is not after the
 * deadline. Using the browser's calendar would disagree for hours around midnight UTC.
 */
export function daysUntil(value: string, now: Date): number {
  const { date } = parseDate(value)
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Math.round((date.getTime() - today) / 86_400_000)
}

export function formatRelativeDays(days: number, locale: string): string {
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(days, 'day')
}
