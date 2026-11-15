import { daysUntil, formatDate, formatMoney, formatRelativeDays } from './format'

describe('formatMoney', () => {
  it('uses the narrow currency symbol for the locale', () => {
    expect(formatMoney(75, 'EUR', 'en')).toBe('€75.00')
    expect(formatMoney(80, 'GBP', 'en')).toBe('£80.00')
  })

  it('keeps a readable code when the currency has no symbol', () => {
    expect(formatMoney(250000, 'UZS', 'en')).toMatch(/UZS\s?250,000/)
  })

  it('keeps currencies that share a narrow symbol apart', () => {
    const dollars = ['USD', 'CAD', 'AUD'].map((c) => formatMoney(60, c, 'en'))
    const crowns = ['SEK', 'DKK', 'NOK'].map((c) => formatMoney(60, c, 'en'))
    expect(new Set(dollars).size).toBe(3)
    expect(new Set(crowns).size).toBe(3)
    expect(formatMoney(60, 'USD', 'en')).toBe('$60.00')
    expect(formatMoney(60, 'CAD', 'en')).toBe('CA$60.00')
  })

  it('uses no decimals for currencies without minor units', () => {
    expect(formatMoney(5000, 'JPY', 'en')).toBe('¥5,000')
  })

  it('formats for Russian with the symbol after the amount', () => {
    expect(formatMoney(75, 'EUR', 'ru')).toBe('75,00 €')
  })
})

describe('formatDate', () => {
  it('does not shift a date-only deadline across time zones', () => {
    expect(formatDate('2027-05-31', 'en')).toBe('May 31, 2027')
  })

  it('rejects values that are not dates', () => {
    expect(() => formatDate('soon', 'en')).toThrow(RangeError)
  })
})

describe('daysUntil', () => {
  // The backend decides with the UTC date (Clock.systemUTC()), so the UI counts in UTC too.
  const now = new Date('2026-11-15T23:30:00Z')

  it('counts UTC calendar days, not 24-hour periods', () => {
    expect(daysUntil('2026-11-16', now)).toBe(1)
    expect(daysUntil('2026-11-15', now)).toBe(0)
    expect(daysUntil('2026-11-14', now)).toBe(-1)
  })

  it('agrees with the backend in Los Angeles in the evening of the deadline day', () => {
    // 17:00 in Los Angeles on Dec 1 is already Dec 2 in UTC: the backend rejects, so must the UI.
    expect(daysUntil('2026-12-01', new Date('2026-12-02T01:00:00Z'))).toBe(-1)
  })

  it('agrees with the backend in Tashkent just after local midnight', () => {
    // 01:00 in Tashkent on Dec 2 is still Dec 1 in UTC: the backend accepts, so must the UI.
    expect(daysUntil('2026-12-01', new Date('2026-12-01T20:00:00Z'))).toBe(0)
  })

  it('reads naturally in both locales', () => {
    expect(formatRelativeDays(1, 'en')).toBe('tomorrow')
    expect(formatRelativeDays(197, 'en')).toBe('in 197 days')
    expect(formatRelativeDays(5, 'ru')).toBe('через 5 дней')
  })
})
